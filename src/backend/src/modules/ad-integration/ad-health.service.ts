import { Service } from 'typedi';
import { Logger } from '../common/logger';
import { ActiveDirectoryService } from './ad.service';
import config from '../../config/config';

@Service()
export class ADHealthService {
  private readonly logger = new Logger(ADHealthService.name);
  private healthStatus: {
    connected: boolean;
    lastCheck: Date | null;
    responseTime: number | null;
    errorCount: number;
    consecutiveErrors: number;
    lastError: string | null;
    metrics: {
      totalChecks: number;
      successfulChecks: number;
      failedChecks: number;
      averageResponseTime: number;
    };
  } = {
    connected: false,
    lastCheck: null,
    responseTime: null,
    errorCount: 0,
    consecutiveErrors: 0,
    lastError: null,
    metrics: {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      averageResponseTime: 0,
    },
  };

  constructor(private readonly adService: ActiveDirectoryService) {}

  /**
   * Check AD health status
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    status: string;
    details: any;
    timestamp: Date;
  }> {
    const startTime = Date.now();
    const timestamp = new Date();

    try {
      // Test AD connection
      const isConnected = await this.adService.testConnection();
      const responseTime = Date.now() - startTime;

      // Update health status
      this.updateHealthStatus(true, responseTime, null);

      // Get additional health metrics
      const metrics = await this.getDetailedMetrics();

      return {
        healthy: isConnected,
        status: isConnected ? 'healthy' : 'unhealthy',
        details: {
          connected: isConnected,
          responseTime,
          metrics,
          config: this.getSafeConfig(),
          lastCheck: timestamp,
        },
        timestamp,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Update health status with error
      this.updateHealthStatus(false, responseTime, error.message);

      return {
        healthy: false,
        status: 'unhealthy',
        details: {
          connected: false,
          responseTime,
          error: error.message,
          config: this.getSafeConfig(),
          lastCheck: timestamp,
        },
        timestamp,
      };
    }
  }

  /**
   * Get detailed AD metrics
   */
  private async getDetailedMetrics(): Promise<{
    userCount: number;
    groupCount: number;
    domainInfo: any;
    replicationStatus: any;
    performance: any;
  }> {
    try {
      // Get user count
      const users = await this.adService.searchUsers({
        attributes: ['sAMAccountName'],
        sizeLimit: 1000,
      });

      // Get group count
      const groups = await this.adService.searchGroups({
        attributes: ['name'],
        sizeLimit: 1000,
      });

      // Get domain info (if available)
      let domainInfo = null;
      try {
        domainInfo = await this.adService.getDomainInfo();
      } catch (error) {
        this.logger.debug('Failed to get domain info', { error: error.message });
      }

      return {
        userCount: users.length,
        groupCount: groups.length,
        domainInfo,
        replicationStatus: { status: 'unknown' }, // Would require AD replication monitoring
        performance: {
          searchTime: 0, // Would track actual search times
          authTime: 0, // Would track authentication times
        },
      };
    } catch (error: any) {
      this.logger.error('Failed to get detailed metrics', {
        error: error.message,
      });
      
      return {
        userCount: 0,
        groupCount: 0,
        domainInfo: null,
        replicationStatus: { status: 'error', error: error.message },
        performance: { searchTime: 0, authTime: 0 },
      };
    }
  }

  /**
   * Update health status
   */
  private updateHealthStatus(
    connected: boolean,
    responseTime: number,
    error: string | null
  ): void {
    const now = new Date();

    // Update metrics
    this.healthStatus.metrics.totalChecks++;
    
    if (connected) {
      this.healthStatus.metrics.successfulChecks++;
      this.healthStatus.consecutiveErrors = 0;
    } else {
      this.healthStatus.metrics.failedChecks++;
      this.healthStatus.consecutiveErrors++;
      this.healthStatus.errorCount++;
    }

    // Update average response time
    if (this.healthStatus.metrics.successfulChecks > 0) {
      const totalResponseTime = this.healthStatus.metrics.averageResponseTime * 
        (this.healthStatus.metrics.successfulChecks - 1) + responseTime;
      this.healthStatus.metrics.averageResponseTime = 
        totalResponseTime / this.healthStatus.metrics.successfulChecks;
    } else {
      this.healthStatus.metrics.averageResponseTime = responseTime;
    }

    // Update status
    this.healthStatus.connected = connected;
    this.healthStatus.lastCheck = now;
    this.healthStatus.responseTime = responseTime;
    this.healthStatus.lastError = error;

    // Log status change
    if (!connected) {
      this.logger.warn('AD health check failed', {
        error,
        consecutiveErrors: this.healthStatus.consecutiveErrors,
      });
    } else if (this.healthStatus.consecutiveErrors > 0) {
      this.logger.info('AD health check recovered', {
        responseTime,
        consecutiveErrors: this.healthStatus.consecutiveErrors,
      });
    }
  }

  /**
   * Get current health status
   */
  getHealthStatus(): typeof this.healthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Get health metrics
   */
  getMetrics(): typeof this.healthStatus.metrics {
    return { ...this.healthStatus.metrics };
  }

  /**
   * Check if AD is healthy
   */
  isHealthy(): boolean {
    // Consider unhealthy if too many consecutive errors
    const maxConsecutiveErrors = 5;
    
    return (
      this.healthStatus.connected &&
      this.healthStatus.consecutiveErrors < maxConsecutiveErrors
    );
  }

  /**
   * Get health status with severity
   */
  getHealthStatusWithSeverity(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details: any;
  } {
    const status = this.getHealthStatus();
    const metrics = this.getMetrics();

    // Determine status based on various factors
    if (!status.connected) {
      return {
        status: 'unhealthy',
        severity: status.consecutiveErrors > 10 ? 'critical' : 'high',
        message: `AD connection failed: ${status.lastError || 'Unknown error'}`,
        details: status,
      };
    }

    if (status.consecutiveErrors > 0) {
      return {
        status: 'degraded',
        severity: 'medium',
        message: `AD experiencing intermittent issues (${status.consecutiveErrors} consecutive errors)`,
        details: status,
      };
    }

    // Check response time thresholds
    const responseTimeThresholds = {
      warning: 1000, // 1 second
      critical: 5000, // 5 seconds
    };

    if (status.responseTime && status.responseTime > responseTimeThresholds.critical) {
      return {
        status: 'degraded',
        severity: 'high',
        message: `AD response time is critically slow: ${status.responseTime}ms`,
        details: status,
      };
    }

    if (status.responseTime && status.responseTime > responseTimeThresholds.warning) {
      return {
        status: 'degraded',
        severity: 'medium',
        message: `AD response time is slow: ${status.responseTime}ms`,
        details: status,
      };
    }

    // Check error rate
    const errorRate = metrics.failedChecks / metrics.totalChecks;
    if (errorRate > 0.1) { // 10% error rate
      return {
        status: 'degraded',
        severity: 'medium',
        message: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        details: { ...status, errorRate },
      };
    }

    // Healthy
    return {
      status: 'healthy',
      severity: 'low',
      message: 'AD connection is healthy',
      details: status,
    };
  }

  /**
   * Get configuration for health check (safe version without credentials)
   */
  private getSafeConfig(): any {
    return {
      enabled: config.ad.enabled,
      url: config.ad.url,
      tlsEnabled: config.ad.tlsEnabled,
      searchBase: config.ad.searchBase,
      searchFilter: config.ad.searchFilter,
      timeout: config.ad.timeout,
      connectTimeout: config.ad.connectTimeout,
      sizeLimit: config.ad.sizeLimit,
      timeLimit: config.ad.timeLimit,
      reconnect: config.ad.reconnect,
      strictDN: config.ad.strictDN,
    };
  }

  /**
   * Run comprehensive health check
   */
  async runComprehensiveCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    checks: Array<{
      name: string;
      status: 'passed' | 'failed' | 'warning';
      message: string;
      details: any;
    }>;
    timestamp: Date;
  }> {
    const checks = [];
    const timestamp = new Date();

    // 1. Connection test
    try {
      const startTime = Date.now();
      const connected = await this.adService.testConnection();
      const responseTime = Date.now() - startTime;

      checks.push({
        name: 'connection',
        status: connected ? 'passed' : 'failed',
        message: connected 
          ? `Connected successfully in ${responseTime}ms`
          : 'Failed to connect',
        details: { connected, responseTime },
      });
    } catch (error: any) {
      checks.push({
        name: 'connection',
        status: 'failed',
        message: `Connection failed: ${error.message}`,
        details: { error: error.message },
      });
    }

    // 2. Authentication test
    try {
      const startTime = Date.now();
      const authenticated = await this.adService.testAuthentication();
      const responseTime = Date.now() - startTime;

      checks.push({
        name: 'authentication',
        status: authenticated ? 'passed' : 'failed',
        message: authenticated
          ? `Authentication successful in ${responseTime}ms`
          : 'Authentication failed',
        details: { authenticated, responseTime },
      });
    } catch (error: any) {
      checks.push({
        name: 'authentication',
        status: 'failed',
        message: `Authentication failed: ${error.message}`,
        details: { error: error.message },
      });
    }

    // 3. Search test
    try {
      const startTime = Date.now();
      const users = await this.adService.searchUsers({
        attributes: ['sAMAccountName'],
        sizeLimit: 10,
      });
      const responseTime = Date.now() - startTime;

      checks.push({
        name: 'search',
        status: 'passed',
        message: `Found ${users.length} users in ${responseTime}ms`,
        details: { userCount: users.length, responseTime },
      });
    } catch (error: any) {
      checks.push({
        name: 'search',
        status: 'failed',
        message: `Search failed: ${error.message}`,
        details: { error: error.message },
      });
    }

    // 4. Configuration validation
    try {
      const configErrors = this.validateConfiguration();
      
      checks.push({
        name: 'configuration',
        status: configErrors.length === 0 ? 'passed' : 'warning',
        message: configErrors.length === 0
          ? 'Configuration is valid'
          : `Configuration has ${configErrors.length} issue(s)`,
        details: { errors: configErrors },
      });
    } catch (error: any) {
      checks.push({
        name: 'configuration',
        status: 'failed',
        message: `Configuration validation failed: ${error.message}`,
        details: { error: error.message },
      });
    }

    // 5. Performance test
    try {
      const performance = await this.testPerformance();
      
      checks.push({
        name: 'performance',
        status: performance.healthy ? 'passed' : 'warning',
        message: performance.healthy
          ? 'Performance is within acceptable limits'
          : 'Performance issues detected',
        details: performance,
      });
    } catch (error: any) {
      checks.push({
        name: 'performance',
        status: 'failed',
        message: `Performance test failed: ${error.message}`,
        details: { error: error.message },
      });
    }

    // Determine overall status
    const failedChecks = checks.filter(c => c.status === 'failed').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (failedChecks > 0) {
      overall = 'unhealthy';
    } else if (warningChecks > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return {
      overall,
      checks,
      timestamp,
    };
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): string[] {
    const errors: string[] = [];

    if (!config.ad.enabled) {
      return ['AD integration is disabled'];
    }

    if (!config.ad.url) {
      errors.push('AD URL is not configured');
    }

    if (!config.ad.bindDN) {
      errors.push('Bind DN is not configured');
    }

    if (!config.ad.bindCredentials) {
      errors.push('Bind credentials are not configured');
    }

    if (!config.ad.searchBase) {
      errors.push('Search base is not configured');
    }

    // Check URL format
    if (config.ad.url && !config.ad.url.startsWith('ldap://') && !config.ad.url.startsWith('ldaps://')) {
      errors.push('AD URL must start with ldap:// or ldaps://');
    }

    // Check for unencrypted LDAP in production
    if (config.isProduction && config.ad.url && config.ad.url.startsWith('ldap://')) {
      errors.push('Unencrypted LDAP (ldap://) is not recommended for production');
    }

    // Check timeout values
    if (config.ad.timeout < 1000 || config.ad.timeout > 30000) {
      errors.push(`AD timeout ${config.ad.timeout}ms is outside recommended range (1000-30000ms)`);
    }

    if (config.ad.connectTimeout < 1000 || config.ad.connectTimeout > 30000) {
      errors.push(`AD connect timeout ${config.ad.connectTimeout}ms is outside recommended range (1000-30000ms)`);
    }

    return errors;
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<{
    healthy: boolean;
    metrics: {
      connectionTime: number;
      authTime: number;
      searchTime: number;
      groupLookupTime: number;
    };
    thresholds: {
      connectionTime: number;
      authTime: number;
      searchTime: number;
      groupLookupTime: number;
    };
  }> {
    const metrics = {
      connectionTime: 0,
      authTime: 0,
      searchTime: 0,
      groupLookupTime: 0,
    };

    const thresholds = {
      connectionTime: 5000, // 5 seconds
      authTime: 3000, // 3 seconds
      searchTime: 5000, // 5 seconds
      groupLookupTime: 3000, // 3 seconds
    };

    // Test connection time
    const connectionStart = Date.now();
    await this.adService.testConnection();
    metrics.connectionTime = Date.now() - connectionStart;

    // Test authentication time
    const authStart = Date.now();
    await this.adService.testAuthentication();
    metrics.authTime = Date.now() - authStart;

    // Test search time
    const searchStart = Date.now();
    await this.adService.searchUsers({ sizeLimit: 10 });
    metrics.searchTime = Date.now() - searchStart;

    // Test group lookup time
    const groupStart = Date.now();
    await this.adService.searchGroups({ sizeLimit: 10 });
    metrics.groupLookupTime = Date.now() - groupStart;

    // Check if any metric exceeds thresholds
    const healthy = 
      metrics.connectionTime <= thresholds.connectionTime &&
      metrics.authTime <= thresholds.authTime &&
      metrics.searchTime <= thresholds.searchTime &&
      metrics.groupLookupTime <= thresholds.groupLookupTime;

    return {
      healthy,
      metrics,
      thresholds,
    };
  }

  /**
   * Reset health metrics
   */
  resetMetrics(): void {
    this.healthStatus = {
      connected: false,
      lastCheck: null,
      responseTime: null,
      errorCount: 0,
      consecutiveErrors: 0,
      lastError: null,
      metrics: {
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        averageResponseTime: 0,
      },
    };
    
    this.logger.info('Health metrics reset');
  }

  /**
   * Schedule periodic health checks
   */
  scheduleHealthChecks(intervalMinutes: number = 5): void {
    this.logger.info(`Scheduled health checks every ${intervalMinutes} minutes`);
    
    // In a real implementation, you would set up an interval
    // Example:
    // setInterval(() => {
    //   this.checkHealth().catch(error => {
    //     this.logger.error('Scheduled health check failed', { error: error.message });
    //   });
    // }, intervalMinutes * 60 * 1000);
  }
}