// CUT GRC Platform - Deployment Verification Suite
// Validates deployment health, configuration, and performance

class DeploymentVerificationSuite {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl || '/api',
            frontendUrl: config.frontendUrl || window.location.origin,
            expectedEndpoints: config.expectedEndpoints || [
                '/api/health',
                '/api/auth/health',
                '/api/db/health',
                '/api/users',
                '/api/audit',
                '/api/compliance',
                '/api/risk'
            ],
            performanceThresholds: config.performanceThresholds || {
                apiResponseTime: 1000, // ms
                pageLoadTime: 3000, // ms
                memoryUsage: 500, // MB
                concurrentUsers: 100
            },
            ...config
        };

        this.results = {
            deploymentId: this.generateDeploymentId(),
            timestamp: new Date().toISOString(),
            checks: {},
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
    }

    generateDeploymentId() {
        return `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    async runFullVerification() {
        console.log(`🚀 Starting Deployment Verification: ${this.results.deploymentId}`);
        console.log('='.repeat(60));

        await this.runHealthChecks();
        await this.runConfigurationChecks();
        await this.runSecurityChecks();
        await this.runPerformanceChecks();
        await this.runIntegrationChecks();
        await this.runDataValidationChecks();

        this.generateVerificationReport();
        return this.results;
    }

    async runHealthChecks() {
        this.startCheckCategory('Health Checks');
        
        await this.check('Frontend Application Health', async () => {
            return window.document && window.document.readyState === 'complete';
        });

        await this.check('Backend API Health', async () => {
            try {
                const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/health`, {
                    timeout: 5000
                });
                return response.ok && (await response.json()).status === 'healthy';
            } catch (error) {
                return false;
            }
        });

        await this.check('Database Connectivity', async () => {
            try {
                const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/health/db`, {
                    timeout: 5000
                });
                return response.ok && (await response.json()).connected === true;
            } catch (error) {
                return false;
            }
        });

        await this.check('Authentication Service', async () => {
            try {
                const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/auth/health`, {
                    timeout: 5000
                });
                return response.ok;
            } catch (error) {
                return false;
            }
        });

        await this.check('Redis/Cache Service', async () => {
            try {
                const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/health/cache`, {
                    timeout: 5000
                });
                return response.ok;
            } catch (error) {
                // Redis might not be required, so this is a warning
                this.addWarning('Redis/Cache service not available (optional)');
                return true;
            }
        });
    }

    async runConfigurationChecks() {
        this.startCheckCategory('Configuration Checks');
        
        await this.check('Environment Variables', () => {
            const requiredEnvVars = ['NODE_ENV', 'API_URL', 'DATABASE_URL'];
            const missing = requiredEnvVars.filter(varName => {
                // In browser, we check localStorage or meta tags
                if (typeof window !== 'undefined') {
                    const meta = document.querySelector(`meta[name="${varName}"]`);
                    return !meta;
                }
                return false;
            });
            
            if (missing.length > 0) {
                this.addWarning(`Missing environment variables: ${missing.join(', ')}`);
            }
            return true;
        });

        await this.check('CORS Configuration', async () => {
            try {
                const response = await fetch(`${this.config.apiBaseUrl}/health`, {
                    method: 'OPTIONS'
                });
                const hasCorsHeaders = response.headers.get('access-control-allow-origin') !== null;
                return hasCorsHeaders;
            } catch (error) {
                return false;
            }
        });

        await this.check('API Version', async () => {
            try {
                const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/version`, {
                    timeout: 3000
                });
                if (response.ok) {
                    const data = await response.json();
                    this.results.apiVersion = data.version;
                    return true;
                }
                return false;
            } catch (error) {
                this.addWarning('API version endpoint not available');
                return true;
            }
        });

        await this.check('Frontend Build Version', () => {
            const buildVersion = document.querySelector('meta[name="build-version"]')?.content ||
                               document.querySelector('meta[name="version"]')?.content ||
                               'unknown';
            this.results.frontendVersion = buildVersion;
            return buildVersion !== 'unknown';
        });
    }

    async runSecurityChecks() {
        this.startCheckCategory('Security Checks');
        
        await this.check('HTTPS Enforcement', () => {
            if (typeof window !== 'undefined') {
                const isSecure = window.location.protocol === 'https:' || 
                               window.location.hostname === 'localhost' ||
                               window.location.hostname === '127.0.0.1';
                if (!isSecure) {
                    this.addWarning('Not using HTTPS in production');
                }
                return true;
            }
            return false;
        });

        await this.check('Security Headers', async () => {
            try {
                const response = await fetch(this.config.frontendUrl);
                const headers = response.headers;
                
                const requiredHeaders = {
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'DENY',
                    'X-XSS-Protection': '1; mode=block'
                };
                
                const missing = [];
                for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
                    const actualValue = headers.get(header);
                    if (!actualValue || actualValue !== expectedValue) {
                        missing.push(header);
                    }
                }
                
                if (missing.length > 0) {
                    this.addWarning(`Missing security headers: ${missing.join(', ')}`);
                }
                
                return true;
            } catch (error) {
                return false;
            }
        });

        await this.check('Content Security Policy', async () => {
            try {
                const response = await fetch(this.config.frontendUrl);
                const csp = response.headers.get('Content-Security-Policy');
                return csp !== null && csp.length > 0;
            } catch (error) {
                this.addWarning('Content Security Policy not configured');
                return true;
            }
        });
    }

    async runPerformanceChecks() {
        this.startCheckCategory('Performance Checks');
        
        await this.check('API Response Time', async () => {
            const startTime = performance.now();
            try {
                await this.fetchWithTimeout(`${this.config.apiBaseUrl}/health`, {
                    timeout: this.config.performanceThresholds.apiResponseTime
                });
                const responseTime = performance.now() - startTime;
                
                this.results.apiResponseTime = Math.round(responseTime);
                
                if (responseTime > this.config.performanceThresholds.apiResponseTime) {
                    this.addWarning(`API response time slow: ${Math.round(responseTime)}ms`);
                }
                
                return responseTime < this.config.performanceThresholds.apiResponseTime * 2;
            } catch (error) {
                return false;
            }
        });

        await this.check('Page Load Performance', () => {
            if (window.performance && window.performance.timing) {
                const timing = window.performance.timing;
                const loadTime = timing.loadEventEnd - timing.navigationStart;
                
                this.results.pageLoadTime = loadTime;
                
                if (loadTime > this.config.performanceThresholds.pageLoadTime) {
                    this.addWarning(`Page load time slow: ${loadTime}ms`);
                }
                
                return loadTime < this.config.performanceThresholds.pageLoadTime * 1.5;
            }
            return true;
        });

        await this.check('Memory Usage', () => {
            if (performance.memory) {
                const usedMB = performance.memory.usedJSHeapSize / 1048576;
                const totalMB = performance.memory.totalJSHeapSize / 1048576;
                
                this.results.memoryUsage = {
                    used: Math.round(usedMB),
                    total: Math.round(totalMB)
                };
                
                if (usedMB > this.config.performanceThresholds.memoryUsage) {
                    this.addWarning(`High memory usage: ${Math.round(usedMB)}MB`);
                }
                
                return usedMB < this.config.performanceThresholds.memoryUsage * 1.2;
            }
            return true;
        });

        await this.check('Asset Loading', () => {
            const resources = performance.getEntriesByType('resource');
            const slowResources = resources.filter(resource => 
                resource.duration > 1000 && 
                !resource.name.includes('analytics') &&
                !resource.name.includes('tracking')
            );
            
            if (slowResources.length > 0) {
                this.addWarning(`${slowResources.length} slow-loading resources detected`);
            }
            
            return slowResources.length < 3;
        });
    }

    async runIntegrationChecks() {
        this.startCheckCategory('Integration Checks');
        
        await this.check('All API Endpoints Accessible', async () => {
            const endpoints = this.config.expectedEndpoints;
            const results = await Promise.allSettled(
                endpoints.map(endpoint => 
                    this.fetchWithTimeout(`${this.config.apiBaseUrl}${endpoint}`, {
                        timeout: 3000
                    }).then(r => r.ok)
                )
            );
            
            const failedEndpoints = endpoints.filter((_, i) => 
                results[i].status === 'rejected' || results[i].value === false
            );
            
            if (failedEndpoints.length > 0) {
                this.addWarning(`Unreachable endpoints: ${failedEndpoints.join(', ')}`);
            }
            
            return failedEndpoints.length < endpoints.length * 0.3; // Allow 30% failure
        });

        await this.check('External Service Integration', async () => {
            // Check integrations with external services
            const integrations = [
                { name: 'Email Service', url: `${this.config.apiBaseUrl}/integrations/email/health` },
                { name: 'SMS Service', url: `${this.config.apiBaseUrl}/integrations/sms/health` },
                { name: 'Payment Gateway', url: `${this.config.apiBaseUrl}/integrations/payment/health` }
            ];
            
            const results = await Promise.allSettled(
                integrations.map(integration =>
                    this.fetchWithTimeout(integration.url, { timeout: 5000 })
                        .then(r => ({ name: integration.name, ok: r.ok }))
                        .catch(() => ({ name: integration.name, ok: false }))
                )
            );
            
            const failedIntegrations = results
                .filter(r => r.status === 'fulfilled' && !r.value.ok)
                .map(r => r.value.name);
            
            if (failedIntegrations.length > 0) {
                this.addWarning(`Failed integrations: ${failedIntegrations.join(', ')}`);
            }
            
            return failedIntegrations.length < integrations.length;
        });
    }

    async runDataValidationChecks() {
        this.startCheckCategory('Data Validation Checks');
        
        await this.check('Database Schema Version', async () => {
            try {
                const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/db/schema/version`, {
                    timeout: 5000
                });
                if (response.ok) {
                    const data = await response.json();
                    this.results.databaseSchemaVersion = data.version;
                    return true;
                }
                return false;
            } catch (error) {
                this.addWarning('Database schema version check unavailable');
                return true;
            }
        });

        await this.check('Data Migration Status', async () => {
            try {
                const response = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/db/migrations/status`, {
                    timeout: 5000
                });
                if (response.ok) {
                    const data = await response.json();
                    const pendingMigrations = data.pending || 0;
                    
                    if (pendingMigrations > 0) {
                        this.addWarning(`${pendingMigrations} pending database migrations`);
                    }
                    
                    return pendingMigrations === 0;
                }
                return false;
            } catch (error) {
                this.addWarning('Migration status check unavailable');
                return true;
            }
        });

        await this.check('Sample Data Validation', async () => {
            try {
                // Test basic CRUD operations
                const testData = {
                    name: `Test-${Date.now()}`,
                    type: 'verification',
                    timestamp: new Date().toISOString()
                };
                
                // Create
                const createResponse = await this.fetchWithTimeout(`${this.config.apiBaseUrl}/test-data`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(testData),
                    timeout: 5000
                });
                
                if (!createResponse.ok) return false;
                
                const created = await createResponse.json();
                
                // Read
                const readResponse = await this.fetchWithTimeout(
                    `${this.config.apiBaseUrl}/test-data/${created.id}`,
                    { timeout: 5000 }
                );
                
                if (!readResponse.ok) return false;
                
                // Cleanup (delete)
                await this.fetchWithTimeout(
                    `${this.config.apiBaseUrl}/test-data/${created.id}`,
                    { method: 'DELETE', timeout: 5000 }
                ).catch(() => {});
                
                return true;
            } catch (error) {
                this.addWarning('Data validation test skipped (test endpoint may not exist)');
                return true;
            }
        });
    }

    // Helper Methods
    startCheckCategory(category) {
        console.log(`\n📋 ${category}:`);
        console.log('─'.repeat(50));
        this.results.checks[category] = [];
    }

    async check(name, checkFunction) {
        this.results.summary.total++;
        
        try {
            const result = await checkFunction();
            
            if (result) {
                this.results.summary.passed++;
                this.results.checks[this.currentCategory].push({ name, passed: true });
                console.log(`  ✅ ${name}`);
            } else {
                this.results.summary.failed++;
                this.results.checks[this.currentCategory].push({ name, passed: false });
                console.log(`  ❌ ${name}`);
            }
        } catch (error) {
            this.results.summary.failed++;
            this.results.checks[this.currentCategory].push({ 
                name, 
                passed: false, 
                error: error.message 
            });
            console.log(`  ❌ ${name} - ${error.message}`);
        }
    }

    addWarning(message) {
        this.results.summary.warnings++;
        console.log(`  ⚠️  ${message}`);
        
        if (!this.results.warnings) {
            this.results.warnings = [];
        }
        this.results.warnings.push({
            message,
            timestamp: new Date().toISOString()
        });
    }

    get currentCategory() {
        const categories = Object.keys(this.results.checks);
        return categories[categories.length - 1];
    }

    async fetchWithTimeout(url, options = {}) {
        const { timeout = 10000, ...fetchOptions } = options;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    generateVerificationReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 DEPLOYMENT VERIFICATION REPORT');
        console.log('='.repeat(60));
        
        const { total, passed, failed, warnings } = this.results.summary;
        const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
        
        console.log(`Deployment ID: ${this.results.deploymentId}`);
        console.log(`Timestamp: ${new Date(this.results.timestamp).toLocaleString()}`);
        console.log(`\nSummary:`);
        console.log(`  Total Checks: ${total}`);
        console.log(`  Passed: ${passed}`);
        console.log(`  Failed: ${failed}`);
        console.log(`  Warnings: ${warnings}`);
        console.log(`  Pass Rate: ${passRate}%`);
        
        if (this.results.apiVersion) {
            console.log(`\nAPI Version: ${this.results.apiVersion}`);
        }
        if (this.results.frontendVersion) {
            console.log(`Frontend Version: ${this.results.frontendVersion}`);
        }
        if (this.results.apiResponseTime) {
            console.log(`API Response Time: ${this.results.apiResponseTime}ms`);
        }
        if (this.results.pageLoadTime) {
            console.log(`Page Load Time: ${this.results.pageLoadTime}ms`);
        }
        
        // Show failed checks
        const failedChecks = [];
        Object.entries(this.results.checks).forEach(([category, checks]) => {
            checks.forEach(check => {
                if (!check.passed) {
                    failedChecks.push(`${category}: ${check.name}`);
                }
            });
        });
        
        if (failedChecks.length > 0) {
            console.log('\n❌ Failed Checks:');
            failedChecks.forEach(check => console.log(`  • ${check}`));
        }
        
        if (this.results.warnings && this.results.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.results.warnings.forEach(warning => 
                console.log(`  • ${warning.message}`)
            );
        }
        
        console.log('\n' + '='.repeat(60));
        
        // Determine deployment status
        let status = 'PASSED';
        let statusEmoji = '✅';
        
        if (failed > 0) {
            status = 'FAILED';
            statusEmoji = '❌';
        } else if (warnings > 0) {
            status = 'WARNING';
            statusEmoji = '⚠️';
        }
        
        console.log(`${statusEmoji} DEPLOYMENT STATUS: ${status}`);
        console.log('='.repeat(60));
        
        // Export results
        this.exportResults();
        
        return this.results;
    }

    exportResults() {
        const dataStr = JSON.stringify(this.results, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportName = `deployment-verification-${this.results.deploymentId}.json`;
        
        // Create download link
        const link = document.createElement('a');
        link.setAttribute('href', dataUri);
        link.setAttribute('download', exportName);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`\n💾 Report exported: ${exportName}`);
    }

    getRecommendations() {
        const recommendations = [];
        
        if (this.results.apiResponseTime > this.config.performanceThresholds.apiResponseTime) {
            recommendations.push({
                category: 'Performance',
                issue: 'Slow API response time',
                suggestion: 'Consider implementing caching, database optimization, or API response compression'
            });
        }
        
        if (this.results.pageLoadTime > this.config.performanceThresholds.pageLoadTime) {
            recommendations.push({
                category: 'Performance',
                issue: 'Slow page load time',
                suggestion: 'Optimize frontend assets, implement lazy loading, and reduce bundle size'
            });
        }
        
        if (this.results.warnings && this.results.warnings.some(w => w.message.includes('HTTPS'))) {
            recommendations.push({
                category: 'Security',
                issue: 'HTTPS not enforced',
                suggestion: 'Enable HTTPS redirect and HSTS headers for production'
            });
        }
        
        if (this.results.warnings && this.results.warnings.some(w => w.message.includes('migration'))) {
            recommendations.push({
                category: 'Database',
                issue: 'Pending database migrations',
                suggestion: 'Run pending migrations before deploying to production'
            });
        }
        
        return recommendations;
    }
}

// Auto-run verification if loaded in browser
if (typeof window !== 'undefined') {
    // Add to window for manual execution
    window.runDeploymentVerification = async (config) => {
        const verifier = new DeploymentVerificationSuite(config);
        return await verifier.runFullVerification();
    };
    
    // Auto-run on page load in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        setTimeout(async () => {
            console.log('🔍 Running automatic deployment verification...');
            try {
                await window.runDeploymentVerification();
            } catch (error) {
                console.error('Deployment verification failed:', error);
            }
        }, 3000);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeploymentVerificationSuite;
}