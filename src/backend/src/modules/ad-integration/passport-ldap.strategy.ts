import passport from 'passport';
import { Strategy as LdapStrategy } from 'passport-ldapauth';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import config from '../../config/config';
import logger from '../../config/logger';
import { ActiveDirectoryService, ADUser } from './ad.service';
import { JWTService, TokenPayload } from '../../utils/jwt';

export interface ADUserProfile {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  title?: string;
  department?: string;
  company?: string;
  groups: string[];
  dn: string;
  distinguishedName: string;
  isActive: boolean;
  isLocked: boolean;
}

export class PassportLDAPStrategy {
  private adService: ActiveDirectoryService;
  private isADEnabled: boolean;

  constructor(adService: ActiveDirectoryService) {
    this.adService = adService;
    this.isADEnabled = config.ad?.enabled || false;
  }

  /**
   * Initialize all passport strategies
   */
  initialize() {
    // JWT Strategy (for API tokens)
    passport.use(
      new JwtStrategy(
        {
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: config.jwt.secret,
          algorithms: ['HS256'],
          ignoreExpiration: false,
          passReqToCallback: false,
        },
        async (jwtPayload: TokenPayload, done) => {
          try {
            // Check if user exists and is active
            // In a real app, you would check the database
            if (jwtPayload && jwtPayload.userId) {
              return done(null, jwtPayload);
            }
            return done(null, false);
          } catch (error) {
            return done(error, false);
          }
        }
      )
    );

    // Local Strategy (fallback for non-AD users)
    passport.use(
      new LocalStrategy(
        {
          usernameField: 'email',
          passwordField: 'password',
          passReqToCallback: false,
        },
        async (email, password, done) => {
          try {
            // Only use local strategy if AD is disabled
            if (this.isADEnabled) {
              return done(null, false, { message: 'AD authentication is enabled. Please use AD credentials.' });
            }

            // Local database authentication logic
            // This would check against your local user database
            logger.info(`Local authentication attempt for: ${email}`);
            
            // For now, return false
            return done(null, false, { message: 'Invalid credentials' });
          } catch (error: any) {
            logger.error('Local authentication error:', error);
            return done(error, false);
          }
        }
      )
    );

    // LDAP/AD Strategy
    if (this.isADEnabled) {
      const ldapOptions = {
        server: {
          url: config.ad?.url || 'ldap://localhost:389',
          bindDN: config.ad?.bindDN || '',
          bindCredentials: config.ad?.bindCredentials || '',
          searchBase: config.ad?.searchBase || 'dc=domain,dc=com',
          searchFilter: config.ad?.searchFilter || '(sAMAccountName={{username}})',
          searchAttributes: [
            'dn',
            'sAMAccountName',
            'userPrincipalName',
            'mail',
            'givenName',
            'sn',
            'displayName',
            'title',
            'department',
            'company',
            'telephoneNumber',
            'mobile',
            'manager',
            'memberOf',
            'distinguishedName',
            'userAccountControl',
            'lockoutTime',
          ],
          tlsOptions: config.ad?.tlsOptions || { rejectUnauthorized: false },
          reconnect: true,
        },
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true,
      };

      passport.use(
        'ldap',
        new LdapStrategy(ldapOptions, async (req, user, done) => {
          try {
            // Map AD user to application profile
            const profile = await this.mapADUserToProfile(user);
            
            if (!profile.isActive) {
              return done(null, false, { message: 'User account is disabled' });
            }

            if (profile.isLocked) {
              return done(null, false, { message: 'User account is locked' });
            }

            // Log successful authentication
            logger.info(`AD authentication successful for user: ${profile.username}`);
            
            return done(null, profile);
          } catch (error: any) {
            logger.error('LDAP authentication error:', error);
            return done(error, false);
          }
        })
      );
    }
  }

  /**
   * Map AD user object to application profile
   */
  private async mapADUserToProfile(adUser: any): Promise<ADUserProfile> {
    const username = adUser.sAMAccountName || adUser.userPrincipalName?.split('@')[0] || '';
    const email = adUser.mail || adUser.userPrincipalName || '';
    const firstName = adUser.givenName || '';
    const lastName = adUser.sn || '';
    const displayName = adUser.displayName || `${firstName} ${lastName}`.trim();
    
    // Extract groups from memberOf
    const groups = adUser.memberOf || [];
    const groupNames = groups.map((groupDN: string) => {
      // Extract CN from DN (e.g., "CN=GRC_Admins,OU=Groups,DC=domain,DC=com" -> "GRC_Admins")
      const match = groupDN.match(/CN=([^,]+)/);
      return match ? match[1] : groupDN;
    });

    // Check account status
    const userAccountControl = adUser.userAccountControl || '0';
    const lockoutTime = adUser.lockoutTime || '0';
    
    const isActive = this.adService.isUserAccountActive(userAccountControl);
    const isLocked = this.adService.isUserAccountLocked(lockoutTime);

    // Generate user ID (use sAMAccountName or create hash from DN)
    const userId = `ad_${username}`;

    return {
      id: userId,
      username,
      email,
      firstName,
      lastName,
      displayName,
      title: adUser.title,
      department: adUser.department,
      company: adUser.company,
      groups: groupNames,
      dn: adUser.dn,
      distinguishedName: adUser.distinguishedName || adUser.dn,
      isActive,
      isLocked,
    };
  }

  /**
   * Get authentication strategies based on configuration
   */
  getAuthenticationStrategies() {
    const strategies = ['jwt'];
    
    if (this.isADEnabled) {
      strategies.push('ldap');
    } else {
      strategies.push('local');
    }
    
    return strategies;
  }

  /**
   * Get strategy middleware for specific route
   */
  getStrategyMiddleware(strategy: string) {
    switch (strategy) {
      case 'jwt':
        return passport.authenticate('jwt', { session: false });
      case 'ldap':
        return passport.authenticate('ldap', { session: false });
      case 'local':
        return passport.authenticate('local', { session: false });
      default:
        return passport.authenticate('jwt', { session: false });
    }
  }

  /**
   * Serialize user for session
   */
  serializeUser() {
    passport.serializeUser((user: any, done) => {
      done(null, user.id);
    });
  }

  /**
   * Deserialize user from session
   */
  deserializeUser() {
    passport.deserializeUser(async (id: string, done) => {
      try {
        // In a real app, you would fetch user from database
        // For now, return a minimal user object
        done(null, { id, username: id.split('_')[1] });
      } catch (error: any) {
        done(error, null);
      }
    });
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateToken(userProfile: ADUserProfile, additionalClaims: any = {}): string {
    // Map AD groups to application roles
    const role = this.mapADGroupsToRole(userProfile.groups);
    const permissions = this.getPermissionsForRole(role);

    const tokenPayload: TokenPayload = {
      userId: userProfile.id,
      email: userProfile.email,
      role,
      permissions,
      ...additionalClaims,
      adProfile: {
        username: userProfile.username,
        displayName: userProfile.displayName,
        department: userProfile.department,
        groups: userProfile.groups,
        dn: userProfile.dn,
      },
    };

    return JWTService.generateAccessToken(tokenPayload);
  }

  /**
   * Map AD groups to application roles
   */
  private mapADGroupsToRole(adGroups: string[]): string {
    // Define role mapping based on AD groups
    const roleMapping: Record<string, string> = {
      'GRC_Admins': 'admin',
      'GRC_Managers': 'manager',
      'GRC_Auditors': 'auditor',
      'GRC_Users': 'user',
      'Domain Admins': 'admin',
      'Enterprise Admins': 'admin',
    };

    // Check for exact matches first
    for (const group of adGroups) {
      if (roleMapping[group]) {
        return roleMapping[group];
      }
    }

    // Check for partial matches
    for (const group of adGroups) {
      if (group.toLowerCase().includes('admin')) return 'admin';
      if (group.toLowerCase().includes('manager')) return 'manager';
      if (group.toLowerCase().includes('auditor')) return 'auditor';
    }

    // Default role
    return 'user';
  }

  /**
   * Get permissions based on role
   */
  private getPermissionsForRole(role: string): string[] {
    const permissions: Record<string, string[]> = {
      admin: [
        'view_risks',
        'create_risks',
        'edit_risks',
        'delete_risks',
        'view_compliance',
        'manage_compliance',
        'view_audits',
        'manage_audits',
        'view_users',
        'manage_users',
        'system_config',
        'generate_reports',
        'approve_workflows',
        'manage_departments',
      ],
      manager: [
        'view_risks',
        'create_risks',
        'edit_risks',
        'view_compliance',
        'manage_compliance',
        'view_audits',
        'generate_reports',
        'approve_workflows',
        'manage_departments',
      ],
      auditor: [
        'view_risks',
        'view_compliance',
        'audit_risks',
        'audit_compliance',
        'generate_reports',
        'create_findings',
        'manage_findings',
      ],
      user: [
        'view_risks',
        'create_risks',
        'view_compliance',
        'submit_compliance',
        'view_own_audits',
      ],
    };

    return permissions[role] || permissions.user;
  }

  /**
   * Check if user has permission
   */
  hasPermission(user: any, permission: string): boolean {
    if (!user || !user.permissions) return false;
    return user.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(user: any, permissions: string[]): boolean {
    if (!user || !user.permissions) return false;
    return permissions.some(permission => user.permissions.includes(permission));
  }

  /**
   * Check if user has all of the specified permissions
   */
  hasAllPermissions(user: any, permissions: string[]): boolean {
    if (!user || !user.permissions) return false;
    return permissions.every(permission => user.permissions.includes(permission));
  }

  /**
   * Get user's department from AD profile
   */
  getUserDepartment(userProfile: ADUserProfile): string {
    return userProfile.department || 'Unknown';
  }

  /**
   * Get user's manager from AD
   */
  async getUserManager(userProfile: ADUserProfile): Promise<ADUserProfile | null> {
    try {
      if (!userProfile.dn) return null;

      const user = await this.adService.getUserDetails(userProfile.dn);
      if (!user || !user.manager) return null;

      const manager = await this.adService.getUserDetails(user.manager);
      if (!manager) return null;

      return this.mapADUserToProfile(manager);
    } catch (error: any) {
      logger.error('Error getting user manager:', error);
      return null;
    }
  }

  /**
   * Get users in same department
   */
  async getUsersInSameDepartment(userProfile: ADUserProfile): Promise<ADUserProfile[]> {
    try {
      if (!userProfile.department) return [];

      // Search for users in same department
      const filter = `(&(objectClass=user)(department=${userProfile.department}))`;
      const users = await this.adService.search<ADUser>(filter, [
        'dn',
        'sAMAccountName',
        'mail',
        'givenName',
        'sn',
        'displayName',
        'title',
        'department',
        'memberOf',
        'userAccountControl',
      ]);

      return Promise.all(users.map(user => this.mapADUserToProfile(user)));
    } catch (error: any) {
      logger.error('Error getting users in department:', error);
      return [];
    }
  }
}

// Singleton instance
let passportStrategyInstance: PassportLDAPStrategy | null = null;

export function getPassportStrategy(): PassportLDAPStrategy {
  if (!passportStrategyInstance) {
    const adService = new ActiveDirectoryService({
      url: config.ad?.url || 'ldap://localhost:389',
      bindDN: config.ad?.bindDN || '',
      bindCredentials: config.ad?.bindCredentials || '',
      searchBase: config.ad?.searchBase || 'dc=domain,dc=com',
      searchFilter: config.ad?.searchFilter,
      tlsOptions: config.ad?.tlsOptions || { rejectUnauthorized: false },
    });

    passportStrategyInstance = new PassportLDAPStrategy(adService);
    passportStrategyInstance.initialize();
    passportStrategyInstance.serializeUser();
    passportStrategyInstance.deserializeUser();
  }

  return passportStrategyInstance;
}

export default passport;