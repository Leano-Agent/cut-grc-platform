import { Container } from 'typedi';
import { Router } from 'express';
import passport from 'passport';
import { Logger } from '../common/logger';
import config from '../../config/config';
import { ActiveDirectoryService } from './ad.service';
import { PassportLDAPStrategy } from './passport-ldap.strategy';
import { UserSyncService } from './user-sync.service';
import { ADSyncService } from './ad-sync.service';
import { ADHealthService } from './ad-health.service';
import { ADConfigWizard } from './ad-config.wizard';
import { ADRoutes } from './ad.routes';

export class ADModule {
  private readonly logger = new Logger(ADModule.name);
  private adService: ActiveDirectoryService;
  private passportStrategy: PassportLDAPStrategy;
  private userSyncService: UserSyncService;
  private adSyncService: ADSyncService;
  private adHealthService: ADHealthService;
  private adConfigWizard: ADConfigWizard;
  private adRoutes: ADRoutes;
  private isInitialized = false;

  constructor() {
    // Initialize services
    this.adService = Container.get(ActiveDirectoryService);
    this.passportStrategy = Container.get(PassportLDAPStrategy);
    this.userSyncService = Container.get(UserSyncService);
    this.adSyncService = Container.get(ADSyncService);
    this.adHealthService = Container.get(ADHealthService);
    this.adConfigWizard = Container.get(ADConfigWizard);
    this.adRoutes = new ADRoutes(
      this.adService,
      this.passportStrategy,
      this.userSyncService,
      this.adSyncService,
      this.adHealthService,
      this.adConfigWizard
    );
  }

  /**
   * Initialize the AD module
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      this.logger.warn('AD module already initialized');
      return true;
    }

    try {
      this.logger.info('Initializing AD module...');

      // Check if AD is enabled
      if (!config.ad.enabled) {
        this.logger.info('AD integration is disabled');
        this.isInitialized = true;
        return true;
      }

      // Initialize AD service
      await this.adService.initialize();

      // Initialize Passport strategy
      await this.passportStrategy.initialize();

      // Initialize user sync service
      await this.userSyncService.initialize();

      // Schedule auto sync if enabled
      if (config.ad.autoSyncEnabled) {
        this.adSyncService.scheduleAutoSync(config.ad.autoSyncSchedule);
      }

      // Schedule health checks
      this.adHealthService.scheduleHealthChecks(5); // Every 5 minutes

      // Perform initial health check
      await this.adHealthService.checkHealth();

      this.isInitialized = true;
      this.logger.info('AD module initialized successfully');
      
      return true;
    } catch (error: any) {
      this.logger.error('Failed to initialize AD module', {
        error: error.message,
        stack: error.stack,
      });
      
      return false;
    }
  }

  /**
   * Get the router for AD routes
   */
  getRouter(): Router {
    return this.adRoutes.getRouter();
  }

  /**
   * Get AD service
   */
  getADService(): ActiveDirectoryService {
    return this.adService;
  }

  /**
   * Get user sync service
   */
  getUserSyncService(): UserSyncService {
    return this.userSyncService;
  }

  /**
   * Get AD sync service
   */
  getADSyncService(): ADSyncService {
    return this.adSyncService;
  }

  /**
   * Get AD health service
   */
  getADHealthService(): ADHealthService {
    return this.adHealthService;
  }

  /**
   * Get AD config wizard
   */
  getADConfigWizard(): ADConfigWizard {
    return this.adConfigWizard;
  }

  /**
   * Check if AD module is initialized
   */
  isModuleInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if AD is enabled
   */
  isEnabled(): boolean {
    return config.ad.enabled;
  }

  /**
   * Get module status
   */
  getStatus(): {
    enabled: boolean;
    initialized: boolean;
    adConnected: boolean;
    services: {
      adService: boolean;
      passportStrategy: boolean;
      userSyncService: boolean;
      adSyncService: boolean;
      adHealthService: boolean;
    };
    config: {
      url: string;
      searchBase: string;
      autoSyncEnabled: boolean;
      syncOnLogin: boolean;
      fallbackToLocalAuth: boolean;
    };
  } {
    return {
      enabled: config.ad.enabled,
      initialized: this.isInitialized,
      adConnected: this.adService.isConnected(),
      services: {
        adService: this.adService.isInitialized(),
        passportStrategy: this.passportStrategy.isInitialized(),
        userSyncService: this.userSyncService.isInitialized(),
        adSyncService: true, // Always true as it's just a service
        adHealthService: true, // Always true as it's just a service
      },
      config: {
        url: config.ad.url,
        searchBase: config.ad.searchBase,
        autoSyncEnabled: config.ad.autoSyncEnabled,
        syncOnLogin: config.ad.syncOnLogin,
        fallbackToLocalAuth: config.ad.fallbackToLocalAuth,
      },
    };
  }

  /**
   * Perform health check
   */
  async performHealthCheck(): Promise<{
    healthy: boolean;
    status: string;
    details: any;
  }> {
    try {
      const healthResult = await this.adHealthService.checkHealth();
      return healthResult;
    } catch (error: any) {
      this.logger.error('Health check failed', {
        error: error.message,
      });
      
      return {
        healthy: false,
        status: 'error',
        details: {
          error: error.message,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Perform synchronization
   */
  async performSync(options?: {
    syncUsers?: boolean;
    syncGroups?: boolean;
    syncDepartments?: boolean;
    force?: boolean;
    incremental?: boolean;
  }): Promise<{
    success: boolean;
    stats: any;
    errors: string[];
  }> {
    try {
      return await this.adSyncService.performFullSync(options);
    } catch (error: any) {
      this.logger.error('Synchronization failed', {
        error: error.message,
      });
      
      return {
        success: false,
        stats: {},
        errors: [error.message],
      };
    }
  }

  /**
   * Test AD authentication
   */
  async testAuthentication(username: string, password: string): Promise<{
    success: boolean;
    user: any;
    groups: any[];
    role: string | null;
    department: string | null;
  }> {
    try {
      // Use Passport strategy to authenticate
      return new Promise((resolve, reject) => {
        passport.authenticate('ldap', { session: false }, (error: any, user: any, info: any) => {
          if (error) {
            reject(error);
          } else if (!user) {
            resolve({
              success: false,
              user: null,
              groups: [],
              role: null,
              department: null,
            });
          } else {
            // Get additional user info
            this.adSyncService.testSyncWithUser(username)
              .then(syncResult => {
                resolve({
                  success: true,
                  user: syncResult.user,
                  groups: syncResult.groups,
                  role: syncResult.role,
                  department: syncResult.department,
                });
              })
              .catch(syncError => {
                resolve({
                  success: true,
                  user: { username: user.username },
                  groups: [],
                  role: null,
                  department: null,
                });
              });
          }
        })({ body: { username, password } } as any, {} as any, () => {});
      });
    } catch (error: any) {
      this.logger.error('Authentication test failed', {
        username,
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
   * Run configuration wizard
   */
  async runConfigurationWizard(configData: any): Promise<{
    success: boolean;
    message: string;
    config: any;
    errors: string[];
    warnings: string[];
  }> {
    try {
      return await this.adConfigWizard.runWizard(configData);
    } catch (error: any) {
      this.logger.error('Configuration wizard failed', {
        error: error.message,
      });
      
      return {
        success: false,
        message: `Configuration wizard failed: ${error.message}`,
        config: null,
        errors: [error.message],
        warnings: [],
      };
    }
  }

  /**
   * Get module statistics
   */
  getStatistics(): {
    health: any;
    sync: any;
    users: any;
    config: any;
  } {
    const healthStatus = this.adHealthService.getHealthStatus();
    const syncStatus = this.adSyncService.getSyncStatus();
    const userStats = this.userSyncService.getStatistics();
    const config = this.getSafeConfig();

    return {
      health: {
        connected: healthStatus.connected,
        lastCheck: healthStatus.lastCheck,
        responseTime: healthStatus.responseTime,
        errorCount: healthStatus.errorCount,
        consecutiveErrors: healthStatus.consecutiveErrors,
        metrics: healthStatus.metrics,
      },
      sync: {
        inProgress: syncStatus.inProgress,
        lastSyncTime: syncStatus.lastSyncTime,
        stats: syncStatus.stats,
      },
      users: {
        totalUsers: userStats.totalUsers,
        activeUsers: userStats.activeUsers,
        adUsers: userStats.adUsers,
        localUsers: userStats.localUsers,
        lastSync: userStats.lastSync,
      },
      config,
    };
  }

  /**
   * Get safe configuration (without credentials)
   */
  private getSafeConfig(): any {
    return {
      enabled: config.ad.enabled,
      url: config.ad.url,
      tlsEnabled: config.ad.tlsEnabled,
      searchBase: config.ad.searchBase,
      searchFilter: config.ad.searchFilter,
      usernameAttribute: config.ad.usernameAttribute,
      emailAttribute: config.ad.emailAttribute,
      groupSearchFilter: config.ad.groupSearchFilter,
      roleMappings: config.ad.roleMappings,
      syncDepartments: config.ad.syncDepartments,
      departmentAttribute: config.ad.departmentAttribute,
      autoSyncEnabled: config.ad.autoSyncEnabled,
      autoSyncSchedule: config.ad.autoSyncSchedule,
      syncOnLogin: config.ad.syncOnLogin,
      timeout: config.ad.timeout,
      connectTimeout: config.ad.connectTimeout,
      idleTimeout: config.ad.idleTimeout,
      reconnect: config.ad.reconnect,
      strictDN: config.ad.strictDN,
      sizeLimit: config.ad.sizeLimit,
      timeLimit: config.ad.timeLimit,
      fallbackToLocalAuth: config.ad.fallbackToLocalAuth,
      allowMixedAuth: config.ad.allowMixedAuth,
      logAuthAttempts: config.ad.logAuthAttempts,
      logSyncOperations: config.ad.logSyncOperations,
      logLevel: config.ad.logLevel,
    };
  }

  /**
   * Shutdown the AD module
   */
  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down AD module...');

      // Cancel auto sync
      this.adSyncService.cancelAutoSync();

      // Disconnect AD service
      await this.adService.disconnect();

      this.isInitialized = false;
      this.logger.info('AD module shutdown completed');
    } catch (error: any) {
      this.logger.error('Failed to shutdown AD module', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Reload configuration
   */
  async reloadConfiguration(): Promise<boolean> {
    try {
      this.logger.info('Reloading AD configuration...');

      // Shutdown current module
      await this.shutdown();

      // Re-initialize module
      return await this.initialize();
    } catch (error: any) {
      this.logger.error('Failed to reload AD configuration', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Export configuration
   */
  exportConfiguration(): {
    config: any;
    status: any;
    statistics: any;
  } {
    return {
      config: this.getSafeConfig(),
      status: this.getStatus(),
      statistics: this.getStatistics(),
    };
  }

  /**
   * Import configuration
   */
  async importConfiguration(configData: any): Promise<{
    success: boolean;
    message: string;
    errors: string[];
  }> {
    try {
      // Validate configuration
      const validationResult = this.adConfigWizard.validateConfiguration(configData);
      
      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Configuration validation failed',
          errors: validationResult.errors,
        };
      }

      // Save configuration
      const saveResult = await this.adConfigWizard.saveConfiguration(configData);
      
      if (!saveResult.success) {
        return {
          success: false,
          message: 'Failed to save configuration',
          errors: saveResult.errors,
        };
      }

      // Reload module with new configuration
      const reloadSuccess = await this.reloadConfiguration();
      
      return {
        success: reloadSuccess,
        message: reloadSuccess 
          ? 'Configuration imported and applied successfully' 
          : 'Configuration imported but failed to apply',
        errors: [],
      };
    } catch (error: any) {
      this.logger.error('Failed to import configuration', {
        error: error.message,
      });
      
      return {
        success: false,
        message: `Import failed: ${error.message}`,
        errors: [error.message],
      };
    }
  }
}

// Create singleton instance
let adModuleInstance: ADModule | null = null;

export function getADModule(): ADModule {
  if (!adModuleInstance) {
    adModuleInstance = new ADModule();
  }
  return adModuleInstance;
}

export async function initializeADModule(): Promise<boolean> {
  const module = getADModule();
  return await module.initialize();
}

export function getADRouter(): Router {
  const module = getADModule();
  return module.getRouter();
}