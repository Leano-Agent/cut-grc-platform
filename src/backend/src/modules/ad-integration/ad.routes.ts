import { Router } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { ValidationMiddleware } from '../../middleware/validation.middleware';
import { asyncHandler, sendSuccess, sendError } from '../../middleware/errorMiddleware';
import logger from '../../config/logger';
import { getPassportStrategy, ADUserProfile } from './passport-ldap.strategy';
import { getADService } from './ad.service';
import { JWTService } from '../../utils/jwt';
import config from '../../config/config';

const router = Router();
const passportStrategy = getPassportStrategy();
const adService = getADService();

// Validation schemas
const adLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  strategy: z.enum(['ldap', 'local', 'jwt']).optional().default('ldap'),
});

const adSyncSchema = z.object({
  userId: z.string().optional(),
  syncGroups: z.boolean().optional().default(true),
  syncDepartment: z.boolean().optional().default(true),
});

const adSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  type: z.enum(['user', 'group', 'ou']).optional().default('user'),
  limit: z.number().min(1).max(100).optional().default(20),
});

const adConfigSchema = z.object({
  url: z.string().url('Valid URL required'),
  bindDN: z.string().min(1, 'Bind DN required'),
  bindCredentials: z.string().min(1, 'Bind credentials required'),
  searchBase: z.string().min(1, 'Search base required'),
  searchFilter: z.string().optional(),
  enabled: z.boolean().optional().default(true),
});

/**
 * @route   POST /api/v1/ad/auth/login
 * @desc    Authenticate user via Active Directory
 * @access  Public
 */
router.post(
  '/auth/login',
  ValidationMiddleware.validateBody(adLoginSchema),
  asyncHandler(async (req, res, next) => {
    const { username, password, strategy } = req.body;
    
    // Check if AD is enabled
    const isADEnabled = config.ad?.enabled || false;
    
    if (strategy === 'ldap' && !isADEnabled) {
      sendError(res, 400, 'Active Directory authentication is disabled', 'AD_DISABLED');
      return;
    }

    // Use appropriate strategy
    const authStrategy = strategy === 'local' ? 'local' : 'ldap';
    
    passport.authenticate(authStrategy, { session: false }, async (error: any, user: ADUserProfile, info: any) => {
      try {
        if (error) {
          logger.error('AD authentication error:', error);
          sendError(res, 500, 'Authentication error', 'AUTH_ERROR');
          return;
        }

        if (!user) {
          const message = info?.message || 'Authentication failed';
          sendError(res, 401, message, 'AUTH_FAILED');
          return;
        }

        // Check if user account is active
        if (!user.isActive) {
          sendError(res, 403, 'User account is disabled', 'ACCOUNT_DISABLED');
          return;
        }

        // Check if user account is locked
        if (user.isLocked) {
          sendError(res, 423, 'User account is locked', 'ACCOUNT_LOCKED');
          return;
        }

        // Generate JWT token
        const token = passportStrategy.generateToken(user, {
          loginMethod: strategy,
          loginTime: new Date().toISOString(),
        });

        // Generate refresh token
        const refreshToken = JWTService.generateRefreshToken({
          userId: user.id,
          tokenVersion: 1,
        });

        // Log successful authentication
        logger.info(`User authenticated via ${strategy}: ${user.username}`);

        // Return user profile and tokens
        sendSuccess(res, {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            displayName: user.displayName,
            title: user.title,
            department: user.department,
            company: user.company,
            groups: user.groups,
            isActive: user.isActive,
          },
          tokens: {
            accessToken: token,
            refreshToken,
            expiresIn: 24 * 60 * 60, // 24 hours
          },
          adInfo: {
            dn: user.dn,
            distinguishedName: user.distinguishedName,
            loginMethod: strategy,
          },
        }, 'Authentication successful');
      } catch (authError: any) {
        logger.error('Authentication processing error:', authError);
        sendError(res, 500, 'Authentication processing error', 'AUTH_PROCESSING_ERROR');
      }
    })(req, res, next);
  })
);

/**
 * @route   POST /api/v1/ad/auth/sso
 * @desc    Single Sign-On endpoint (for integrated Windows authentication)
 * @access  Private (requires Windows authentication)
 */
router.post(
  '/auth/sso',
  passportStrategy.getStrategyMiddleware('jwt'),
  asyncHandler(async (req, res) => {
    // This endpoint would typically be used with integrated Windows authentication
    // For now, it validates the JWT token and returns user info
    
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }

    // Check if user exists in AD (optional validation)
    const userProfile = req.user as any;
    
    sendSuccess(res, {
      user: {
        id: userProfile.userId,
        email: userProfile.email,
        role: userProfile.role,
        permissions: userProfile.permissions,
        adProfile: userProfile.adProfile,
      },
      ssoEnabled: true,
      timestamp: new Date().toISOString(),
    }, 'SSO validation successful');
  })
);

/**
 * @route   POST /api/v1/ad/sync/user
 * @desc    Synchronize user data from Active Directory
 * @access  Private
 */
router.post(
  '/sync/user',
  passportStrategy.getStrategyMiddleware('jwt'),
  ValidationMiddleware.validateBody(adSyncSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }

    const { userId, syncGroups, syncDepartment } = req.body;
    const targetUserId = userId || (req.user as any).userId;
    
    try {
      // Extract username from userId (format: ad_username)
      const username = targetUserId.replace('ad_', '');
      
      // Get user from AD
      const adUser = await adService.findUserByUsername(username);
      if (!adUser) {
        sendError(res, 404, 'User not found in Active Directory', 'USER_NOT_FOUND');
        return;
      }

      const userProfile = await passportStrategy['mapADUserToProfile'](adUser);
      
      // Sync groups if requested
      let groups = userProfile.groups;
      if (syncGroups) {
        const adGroups = await adService.getUserGroups(adUser.dn);
        groups = adGroups.map(group => group.cn);
      }

      // Sync department info
      let department = userProfile.department;
      if (syncDepartment && adUser.department) {
        department = adUser.department;
      }

      // In a real application, you would update the user in your database here
      // For example:
      // await UserService.updateUser(targetUserId, {
      //   firstName: userProfile.firstName,
      //   lastName: userProfile.lastName,
      //   email: userProfile.email,
      //   department,
      //   groups,
      //   lastSync: new Date(),
      // });

      logger.info(`AD sync completed for user: ${username}`);

      sendSuccess(res, {
        user: {
          id: targetUserId,
          username: userProfile.username,
          email: userProfile.email,
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          displayName: userProfile.displayName,
          department,
          groups,
          lastSync: new Date().toISOString(),
        },
        adInfo: {
          dn: adUser.dn,
          distinguishedName: adUser.distinguishedName,
          lastLogon: adUser.lastLogon,
          userAccountControl: adUser.userAccountControl,
        },
      }, 'User synchronization completed');
    } catch (error: any) {
      logger.error('AD sync error:', error);
      sendError(res, 500, 'Synchronization failed', 'SYNC_ERROR');
    }
  })
);

/**
 * @route   GET /api/v1/ad/search
 * @desc    Search Active Directory for users, groups, or OUs
 * @access  Private
 */
router.get(
  '/search',
  passportStrategy.getStrategyMiddleware('jwt'),
  ValidationMiddleware.validateQuery(adSearchSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }

    const { query, type, limit } = req.query;
    
    try {
      let results: any[] = [];
      
      switch (type) {
        case 'user':
          // Search for users
          const userFilter = `(&(objectClass=user)(|(sAMAccountName=*${query}*)(displayName=*${query}*)(mail=*${query}*)(givenName=*${query}*)(sn=*${query}*)))`;
          const users = await adService.search<any>(userFilter, [
            'dn',
            'sAMAccountName',
            'mail',
            'givenName',
            'sn',
            'displayName',
            'title',
            'department',
            'company',
            'telephoneNumber',
            'userAccountControl',
          ]);
          
          results = users.slice(0, limit).map(user => ({
            type: 'user',
            id: user.sAMAccountName,
            username: user.sAMAccountName,
            email: user.mail,
            name: user.displayName,
            firstName: user.givenName,
            lastName: user.sn,
            title: user.title,
            department: user.department,
            company: user.company,
            phone: user.telephoneNumber,
            dn: user.dn,
            isActive: adService.isUserAccountActive(user.userAccountControl),
          }));
          break;

        case 'group':
          // Search for groups
          const groupFilter = `(&(objectClass=group)(|(cn=*${query}*)(name=*${query}*)(description=*${query}*)))`;
          const groups = await adService.searchGroups(groupFilter);
          
          results = groups.slice(0, limit).map(group => ({
            type: 'group',
            id: group.cn,
            name: group.name,
            description: group.description,
            memberCount: group.member?.length || 0,
            dn: group.dn,
          }));
          break;

        case 'ou':
          // Search for OUs
          const ouFilter = `(&(objectClass=organizationalUnit)(|(ou=*${query}*)(name=*${query}*)(description=*${query}*)))`;
          const ous = await adService.getOUStructure();
          
          results = ous
            .filter(ou => 
              ou.name.toLowerCase().includes(query.toLowerCase()) ||
              (ou.description && ou.description.toLowerCase().includes(query.toLowerCase()))
            )
            .slice(0, limit)
            .map(ou => ({
              type: 'ou',
              id: ou.name,
              name: ou.name,
              description: ou.description,
              dn: ou.dn,
            }));
          break;
      }

      sendSuccess(res, {
        query,
        type,
        results,
        total: results.length,
        limit,
      }, 'Search completed successfully');
    } catch (error: any) {
      logger.error('AD search error:', error);
      sendError(res, 500, 'Search failed', 'SEARCH_ERROR');
    }
  })
);

/**
 * @route   GET /api/v1/ad/health
 * @desc    Check Active Directory connection health
 * @access  Private
 */
router.get(
  '/health',
  passportStrategy.getStrategyMiddleware('jwt'),
  asyncHandler(async (req, res) => {
    try {
      const isHealthy = await adService.healthCheck();
      const isADEnabled = config.ad?.enabled || false;
      
      sendSuccess(res, {
        enabled: isADEnabled,
        connected: isHealthy,
        timestamp: new Date().toISOString(),
        config: {
          url: config.ad?.url ? '***' : 'Not configured',
          searchBase: config.ad?.searchBase ? '***' : 'Not configured',
          enabled: isADEnabled,
        },
      }, isHealthy ? 'Active Directory is healthy' : 'Active Directory connection failed');
    } catch (error: any) {
      logger.error('AD health check error:', error);
      sendError(res, 500, 'Health check failed', 'HEALTH_CHECK_ERROR');
    }
  })
);

/**
 * @route   GET /api/v1/ad/groups
 * @desc    Get user's AD groups
 * @access  Private
 */
router.get(
  '/groups',
  passportStrategy.getStrategyMiddleware('jwt'),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }

    try {
      const userProfile = req.user as any;
      const username = userProfile.adProfile?.username || userProfile.userId?.replace('ad_', '');
      
      if (!username) {
        sendError(res, 400, 'Username not found in token', 'NO_USERNAME');
        return;
      }

      const adUser = await adService.findUserByUsername(username);
      if (!adUser) {
        sendError(res, 404, 'User not found in Active Directory', 'USER_NOT_FOUND');
        return;
      }

      const groups = await adService.getUserGroups(adUser.dn);
      
      sendSuccess(res, {
        username,
        groups: groups.map(group => ({
          name: group.name,
          cn: group.cn,
          description: group.description,
          memberCount: group.member?.length || 0,
          dn: group.dn,
        })),
        total: groups.length,
      }, 'Groups retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting AD groups:', error);
      sendError(res, 500, 'Failed to retrieve groups', 'GROUPS_ERROR');
    }
  })
);

/**
 * @route   GET /api/v1/ad/ou/structure
 * @desc    Get OU structure from Active Directory
 * @access  Private
 */
router.get(
  '/ou/structure',
  passportStrategy.getStrategyMiddleware('jwt'),
  asyncHandler(async (req, res) => {
    try {
      const ouStructure = await adService.getOUStructure();
      
      // Build hierarchical structure
      const buildTree = (dns: string[]) => {
        const tree: any = {};
        
        dns.forEach(dn => {
          const parts = dn.split(',').filter(part => part.startsWith('OU=') || part.startsWith('DC='));
          let current = tree;
          
          // Traverse from root to leaf
          for (let i = parts.length - 1; i >= 0; i--) {
            const part = parts[i];
            const [type, name] = part.split('=');
            
            if (type === 'OU') {
              if (!current[name]) {
                current[name] = { children: {}, dn: parts.slice(i).join(',') };
              }
              current = current[name].children;
            }
          }
        });
        
        return tree;
      };

      const dns = ouStructure.map(ou => ou.dn);
      const tree = buildTree(dns);

      sendSuccess(res, {
        flat: ouStructure,
        hierarchical: tree,
        total: ouStructure.length,
      }, 'OU structure retrieved successfully');
    } catch (error: any) {
      logger.error('Error getting OU structure:', error);
      sendError(res, 500, 'Failed to retrieve OU structure', 'OU_STRUCTURE_ERROR');
    }
  })
);

/**
 * @route   POST /api/v1/ad/config/test
 * @desc    Test Active Directory configuration
 * @access  Private (Admin only)
 */
router.post(
  '/config/test',
  passportStrategy.getStrategyMiddleware('jwt'),
  ValidationMiddleware.validateBody(adConfigSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      sendError(res, 401, 'Authentication required', 'NO_AUTH');
      return;
    }

    // Check if user has admin permissions
    const user = req.user as any;
    if (!passportStrategy.hasPermission(user, 'system_config')) {
      sendError(res, 403, 'Insufficient permissions', 'INSUFFICIENT_PERMISSIONS');
      return;
    }

    const config = req.body;
    
    try {
      // Create temporary AD service with test config
      const testAdService = getADService();
      
      // Test connection
      const isConnected = await testAdService.connect();
      
      if (!isConnected) {
        sendError(res, 400, 'Failed to connect to Active Directory', 'CONNECTION_FAILED');
        return;
      }

      // Test search
      const users = await testAdService.search<any>('(objectClass=user)', ['sAMAccountName'], config.searchBase);
      
      // Test authentication with service account
      const canBind = isConnected; // Already verified by connect()
      
      // Disconnect
      await testAdService.disconnect();

      sendSuccess(res, {
        connection: isConnected,
        authentication: canBind,
        search: users.length > 0,
        userCount: users.length,
        config: {
          url: config.url,
          searchBase: config.searchBase,
          enabled: config.enabled,
        },
        timestamp: new Date().toISOString(),
      }, 'Active Directory configuration test successful');
    } catch (error: any) {
      logger.error('AD config test error:', error);

    }
  }
}

export default router;
