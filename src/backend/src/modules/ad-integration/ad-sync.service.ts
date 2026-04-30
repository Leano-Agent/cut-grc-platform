import { Service } from 'typedi';
import { Logger } from '../common/logger';
import { ActiveDirectoryService } from './ad.service';
import { UserSyncService } from './user-sync.service';
import { ADConfig } from '../../config/ad.config';
import config from '../../config/config';

@Service()
export class ADSyncService {
  private readonly logger = new Logger(ADSyncService.name);
  private syncInProgress = false;
  private lastSyncTime: Date | null = null;
  private syncStats = {
    totalUsers: 0,
    newUsers: 0,
    updatedUsers: 0,
    deactivatedUsers: 0,
    totalGroups: 0,
    newGroups: 0,
    updatedGroups: 0,
    totalDepartments: 0,
    newDepartments: 0,
    updatedDepartments: 0,
    syncDuration: 0,
    errorCount: 0,
  };

  constructor(
    private readonly adService: ActiveDirectoryService,
    private readonly userSyncService: UserSyncService
  ) {}

  /**
   * Perform full synchronization from Active Directory
   */
  async performFullSync(options: {
    syncUsers?: boolean;
    syncGroups?: boolean;
    syncDepartments?: boolean;
    force?: boolean;
    incremental?: boolean;
  } = {}): Promise<{
    success: boolean;
    stats: typeof this.syncStats;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];

    // Default options
    const syncOptions = {
      syncUsers: true,
      syncGroups: true,
      syncDepartments: true,
      force: false,
      incremental: true,
      ...options,
    };

    // Check if sync is already in progress
    if (this.syncInProgress && !syncOptions.force) {
      this.logger.warn('Sync already in progress');
      return {
        success: false,
        stats: this.syncStats,
        errors: ['Sync already in progress'],
      };
    }

    try {
      this.syncInProgress = true;
      this.resetSyncStats();

      this.logger.info('Starting AD synchronization', {
        options: syncOptions,
        incremental: syncOptions.incremental,
      });

      // Check AD connection
      const isConnected = await this.adService.testConnection();
      if (!isConnected) {
        throw new Error('Cannot connect to Active Directory');
      }

      // Synchronize departments
      if (syncOptions.syncDepartments) {
        await this.syncDepartments();
      }

      // Synchronize groups
      if (syncOptions.syncGroups) {
        await this.syncGroups();
      }

      // Synchronize users
      if (syncOptions.syncUsers) {
        await this.syncUsers(syncOptions.incremental);
      }

      // Update sync statistics
      this.syncStats.syncDuration = Date.now() - startTime;
      this.lastSyncTime = new Date();

      this.logger.info('AD synchronization completed successfully', {
        duration: this.syncStats.syncDuration,
        stats: this.syncStats,
      });

      return {
        success: true,
        stats: this.syncStats,
        errors,
      };
    } catch (error: any) {
      this.syncStats.errorCount++;
      errors.push(error.message);
      
      this.logger.error('AD synchronization failed', {
        error: error.message,
        stack: error.stack,
      });

      return {
        success: false,
        stats: this.syncStats,
        errors,
      };
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Synchronize users from Active Directory
   */
  private async syncUsers(incremental: boolean = true): Promise<void> {
    this.logger.info('Starting user synchronization', { incremental });

    try {
      // Get users from Active Directory
      const adUsers = await this.adService.searchUsers({
        attributes: [
          'sAMAccountName',
          'mail',
          'displayName',
          'givenName',
          'sn',
          'title',
          'department',
          'company',
          'telephoneNumber',
          'mobile',
          'manager',
          'whenCreated',
          'whenChanged',
          'userAccountControl',
        ],
        sizeLimit: config.ad.sizeLimit,
        timeLimit: config.ad.timeLimit,
      });

      this.syncStats.totalUsers = adUsers.length;
      this.logger.info(`Found ${adUsers.length} users in Active Directory`);

      // Process each user
      for (const adUser of adUsers) {
        try {
          // Check if user should be synchronized
          if (!this.shouldSyncUser(adUser, incremental)) {
            continue;
          }

          // Get user groups for role mapping
          const userGroups = await this.adService.getUserGroups(adUser.sAMAccountName);
          
          // Sync user to database
          const syncResult = await this.userSyncService.syncUserFromAD(adUser, userGroups);
          
          // Update statistics
          if (syncResult.created) {
            this.syncStats.newUsers++;
          } else if (syncResult.updated) {
            this.syncStats.updatedUsers++;
          }
        } catch (error: any) {
          this.syncStats.errorCount++;
          this.logger.error(`Failed to sync user ${adUser.sAMAccountName}`, {
            error: error.message,
          });
        }
      }

      // Handle deactivated users (if incremental sync)
      if (incremental) {
        await this.handleDeactivatedUsers(adUsers);
      }

      this.logger.info('User synchronization completed', {
        newUsers: this.syncStats.newUsers,
        updatedUsers: this.syncStats.updatedUsers,
        deactivatedUsers: this.syncStats.deactivatedUsers,
      });
    } catch (error: any) {
      this.logger.error('User synchronization failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Synchronize groups from Active Directory
   */
  private async syncGroups(): Promise<void> {
    this.logger.info('Starting group synchronization');

    try {
      // Get groups from Active Directory
      const adGroups = await this.adService.searchGroups({
        attributes: [
          'name',
          'description',
          'member',
          'whenCreated',
          'whenChanged',
        ],
        sizeLimit: config.ad.sizeLimit,
        timeLimit: config.ad.timeLimit,
      });

      this.syncStats.totalGroups = adGroups.length;
      this.logger.info(`Found ${adGroups.length} groups in Active Directory`);

      // Process each group
      for (const adGroup of adGroups) {
        try {
          // Check if group should be synchronized
          if (!this.shouldSyncGroup(adGroup)) {
            continue;
          }

          // Sync group to database
          const syncResult = await this.userSyncService.syncGroupFromAD(adGroup);
          
          // Update statistics
          if (syncResult.created) {
            this.syncStats.newGroups++;
          } else if (syncResult.updated) {
            this.syncStats.updatedGroups++;
          }
        } catch (error: any) {
          this.syncStats.errorCount++;
          this.logger.error(`Failed to sync group ${adGroup.name}`, {
            error: error.message,
          });
        }
      }

      this.logger.info('Group synchronization completed', {
        newGroups: this.syncStats.newGroups,
        updatedGroups: this.syncStats.updatedGroups,
      });
    } catch (error: any) {
      this.logger.error('Group synchronization failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Synchronize departments from Active Directory
   */
  private async syncDepartments(): Promise<void> {
    if (!config.ad.syncDepartments) {
      this.logger.info('Department synchronization is disabled');
      return;
    }

    this.logger.info('Starting department synchronization');

    try {
      // Get departments from Active Directory (OUs and department attributes)
      const departments = await this.adService.searchDepartments({
        attribute: config.ad.departmentAttribute,
        sizeLimit: config.ad.sizeLimit,
        timeLimit: config.ad.timeLimit,
      });

      this.syncStats.totalDepartments = departments.length;
      this.logger.info(`Found ${departments.length} departments in Active Directory`);

      // Process each department
      for (const department of departments) {
        try {
          // Sync department to database
          const syncResult = await this.userSyncService.syncDepartmentFromAD(department);
          
          // Update statistics
          if (syncResult.created) {
            this.syncStats.newDepartments++;
          } else if (syncResult.updated) {
            this.syncStats.updatedDepartments++;
          }
        } catch (error: any) {
          this.syncStats.errorCount++;
          this.logger.error(`Failed to sync department ${department.name}`, {
            error: error.message,
          });
        }
      }

      this.logger.info('Department synchronization completed', {
        newDepartments: this.syncStats.newDepartments,
        updatedDepartments: this.syncStats.updatedDepartments,
      });
    } catch (error: any) {
      this.logger.error('Department synchronization failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Check if user should be synchronized
   */
  private shouldSyncUser(adUser: any, incremental: boolean): boolean {
    // Skip disabled accounts
    if (adUser.userAccountControl && (adUser.userAccountControl & 0x0002)) {
      return false; // Account disabled
    }

    // Skip computer accounts
    if (adUser.sAMAccountName && adUser.sAMAccountName.endsWith('$')) {
      return false;
    }

    // Skip system accounts
    const systemAccounts = ['administrator', 'guest', 'krbtgt', 'admin'];
    if (systemAccounts.includes(adUser.sAMAccountName?.toLowerCase())) {
      return false;
    }

    // For incremental sync, check if user has changed since last sync
    if (incremental && this.lastSyncTime && adUser.whenChanged) {
      const lastChanged = new Date(adUser.whenChanged);
      if (lastChanged < this.lastSyncTime) {
        return false; // User hasn't changed since last sync
      }
    }

    return true;
  }

  /**
   * Check if group should be synchronized
   */
  private shouldSyncGroup(adGroup: any): boolean {
    // Skip system groups
    const systemGroups = [
      'domain admins',
      'enterprise admins',
      'schema admins',
      'administrators',
      'users',
      'guests',
    ];

    if (systemGroups.includes(adGroup.name?.toLowerCase())) {
      return false;
    }

    // Only sync groups that match our role mapping pattern
    const roleMappings = config.ad.roleMappings || {};
    if (!Object.keys(roleMappings).some(group => 
      adGroup.name?.toLowerCase().includes(group.toLowerCase())
    )) {
      return false;
    }

    return true;
  }

  /**
   * Handle deactivated users in Active Directory
   */
  private async handleDeactivatedUsers(currentAdUsers: any[]): Promise<void> {
    try {
      // Get current AD usernames
      const currentUsernames = currentAdUsers
        .filter(user => this.shouldSyncUser(user, false))
        .map(user => user.sAMAccountName?.toLowerCase());

      // Find users in database that are not in current AD users
      const deactivatedUsers = await this.userSyncService.findDeactivatedUsers(currentUsernames);
      
      // Deactivate users in database
      for (const user of deactivatedUsers) {
        try {
          await this.userSyncService.deactivateUser(user.id);
          this.syncStats.deactivatedUsers++;
        } catch (error: any) {
          this.syncStats.errorCount++;
          this.logger.error(`Failed to deactivate user ${user.username}`, {
            error: error.message,
          });
        }
      }

      if (deactivatedUsers.length > 0) {
        this.logger.info(`Deactivated ${deactivatedUsers.length} users not found in Active Directory`);
      }
    } catch (error: any) {
      this.logger.error('Failed to handle deactivated users', {
        error: error.message,
      });
    }
  }

  /**
   * Reset synchronization statistics
   */
  private resetSyncStats(): void {
    this.syncStats = {
      totalUsers: 0,
      newUsers: 0,
      updatedUsers: 0,
      deactivatedUsers: 0,
      totalGroups: 0,
      newGroups: 0,
      updatedGroups: 0,
      totalDepartments: 0,
      newDepartments: 0,
      updatedDepartments: 0,
      syncDuration: 0,
      errorCount: 0,
    };
  }

  /**
   * Get synchronization status
   */
  getSyncStatus(): {
    inProgress: boolean;
    lastSyncTime: Date | null;
    stats: typeof this.syncStats;
  } {
    return {
      inProgress: this.syncInProgress,
      lastSyncTime: this.lastSyncTime,
      stats: this.syncStats,
    };
  }

  /**
   * Get synchronization statistics
   */
  getStatistics(): typeof this.syncStats {
    return { ...this.syncStats };
  }

  /**
   * Test synchronization with a single user
   */
  async testSyncWithUser(username: string): Promise<{
    success: boolean;
    user: any;
    groups: any[];
    role: string | null;
    department: string | null;
  }> {
    try {
      // Get user from AD
      const adUser = await this.adService.getUser(username);
      if (!adUser) {
        throw new Error(`User ${username} not found in Active Directory`);
      }

      // Get user groups
      const userGroups = await this.adService.getUserGroups(username);
      
      // Determine role from groups
      const role = this.userSyncService.mapGroupsToRole(userGroups);
      
      // Get department
      const department = adUser.department || adUser.company || null;

      return {
        success: true,
        user: adUser,
        groups: userGroups,
        role,
        department,
      };
    } catch (error: any) {
      this.logger.error(`Test sync failed for user ${username}`, {
        error: error.message,
      });
      
      return {
        success: false,
        user: null,
        groups: [],
        role: null,
        department: null,
      };
    }
  }

  /**
   * Schedule automatic synchronization
   */
  scheduleAutoSync(cronExpression: string = config.ad.autoSyncSchedule): void {
    // This would typically integrate with a job scheduler like node-cron
    // For now, we'll just log the schedule
    this.logger.info(`Auto sync scheduled with cron expression: ${cronExpression}`);
    
    // In a real implementation, you would set up a cron job here
    // Example with node-cron:
    // import cron from 'node-cron';
    // cron.schedule(cronExpression, () => {
    //   this.performFullSync({ incremental: true });
    // });
  }

  /**
   * Cancel scheduled synchronization
   */
  cancelAutoSync(): void {
    this.logger.info('Auto sync cancelled');
    // In a real implementation, you would cancel the cron job here
  }
}