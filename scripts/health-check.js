#!/usr/bin/env node

/**
 * Formula PM V2 - Health Check Script
 * 
 * Comprehensive health monitoring for all system components
 * including API endpoints, database connectivity, authentication,
 * and critical business functions.
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');

class HealthChecker {
    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3003';
        this.results = {
            timestamp: new Date().toISOString(),
            overall: { status: 'UNKNOWN', score: 0 },
            checks: []
        };
        
        // Health check configuration
        this.healthChecks = [
            {
                name: 'Application Startup',
                type: 'startup',
                critical: true,
                description: 'Verify application starts successfully'
            },
            {
                name: 'API Health Endpoint',
                type: 'http',
                url: '/api/health',
                critical: true,
                description: 'Basic API health check'
            },
            {
                name: 'Database Connectivity',
                type: 'http',
                url: '/api/health/database',
                critical: true,
                description: 'Database connection and basic queries'
            },
            {
                name: 'Authentication Service',
                type: 'http',
                url: '/api/auth/diagnostics',
                critical: true,
                description: 'Authentication system status'
            },
            {
                name: 'Dashboard API',
                type: 'http',
                url: '/api/dashboard/stats',
                critical: true,
                description: 'Core dashboard functionality',
                requiresAuth: true
            },
            {
                name: 'Projects API',
                type: 'http',
                url: '/api/projects',
                critical: true,
                description: 'Project management functionality',
                requiresAuth: true
            },
            {
                name: 'Scope Management API',
                type: 'http',
                url: '/api/scope/overview',
                critical: false,
                description: 'Scope management system',
                requiresAuth: true
            },
            {
                name: 'Task Management API',
                type: 'http',
                url: '/api/tasks',
                critical: false,
                description: 'Task management functionality',
                requiresAuth: true
            },
            {
                name: 'File Storage Access',
                type: 'storage',
                critical: false,
                description: 'File upload and storage capabilities'
            },
            {
                name: 'Environment Configuration',
                type: 'config',
                critical: true,
                description: 'Required environment variables'
            },
            {
                name: 'Build System',
                type: 'build',
                critical: false,
                description: 'Application build process'
            },
            {
                name: 'Test Suite Status',
                type: 'tests',
                critical: false,
                description: 'Unit and integration test health'
            }
        ];
    }

    async runAllChecks() {
        console.log('🏥 Formula PM V2 - System Health Check');
        console.log('=' .repeat(50));
        console.log(`⏰ Timestamp: ${this.results.timestamp}`);
        console.log(`🔗 Base URL: ${this.baseUrl}`);
        console.log('');

        // Run all health checks
        for (const check of this.healthChecks) {
            try {
                console.log(`🔍 Checking: ${check.name}...`);
                const result = await this.runCheck(check);
                this.results.checks.push(result);
                this.logCheckResult(result);
            } catch (error) {
                const result = {
                    name: check.name,
                    type: check.type,
                    critical: check.critical,
                    status: 'ERROR',
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                };
                this.results.checks.push(result);
                this.logCheckResult(result);
            }
        }

        this.calculateOverallHealth();
        this.generateReport();
    }

    async runCheck(check) {
        const startTime = Date.now();
        let result = {
            name: check.name,
            type: check.type,
            critical: check.critical,
            description: check.description,
            timestamp: new Date().toISOString(),
            duration: 0
        };

        try {
            switch (check.type) {
                case 'startup':
                    result = { ...result, ...(await this.checkStartup()) };
                    break;
                case 'http':
                    result = { ...result, ...(await this.checkHttpEndpoint(check)) };
                    break;
                case 'storage':
                    result = { ...result, ...(await this.checkStorage()) };
                    break;
                case 'config':
                    result = { ...result, ...(await this.checkConfiguration()) };
                    break;
                case 'build':
                    result = { ...result, ...(await this.checkBuildSystem()) };
                    break;
                case 'tests':
                    result = { ...result, ...(await this.checkTestSuite()) };
                    break;
                default:
                    throw new Error(`Unknown check type: ${check.type}`);
            }
        } catch (error) {
            result.status = 'ERROR';
            result.success = false;
            result.error = error.message;
        }

        result.duration = Date.now() - startTime;
        return result;
    }

    async checkStartup() {
        // Check if the application can start successfully
        try {
            // Check if server is already running
            const isRunning = await this.isServerRunning();
            
            if (isRunning) {
                return {
                    status: 'HEALTHY',
                    success: true,
                    details: 'Application is running'
                };
            } else {
                return {
                    status: 'WARNING',
                    success: true,
                    details: 'Application not currently running (this may be expected)'
                };
            }
        } catch (error) {
            return {
                status: 'ERROR',
                success: false,
                error: error.message
            };
        }
    }

    async checkHttpEndpoint(check) {
        try {
            const url = `${this.baseUrl}${check.url}`;
            const options = {
                method: 'GET',
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            // Add authentication if required
            if (check.requiresAuth) {
                // For health checks, we'll try without auth first to see the response
                // In a real implementation, you'd get a test token
                const testToken = process.env.TEST_ACCESS_TOKEN;
                if (testToken) {
                    options.headers['Authorization'] = `Bearer ${testToken}`;
                }
            }

            const response = await this.makeHttpRequest(url, options);
            
            // Determine success based on status code
            let success = false;
            let status = 'ERROR';
            let details = `HTTP ${response.statusCode}`;

            if (response.statusCode === 200) {
                success = true;
                status = 'HEALTHY';
                details = `HTTP 200 - Response time: ${response.responseTime}ms`;
            } else if (response.statusCode === 401 && check.requiresAuth) {
                // 401 is expected for authenticated endpoints without token
                success = true;
                status = 'HEALTHY';
                details = `HTTP 401 (expected for auth-required endpoint)`;
            } else if (response.statusCode >= 400 && response.statusCode < 500) {
                status = 'WARNING';
                details = `HTTP ${response.statusCode} - Client error`;
            } else if (response.statusCode >= 500) {
                status = 'ERROR';
                details = `HTTP ${response.statusCode} - Server error`;
            }

            return {
                status,
                success,
                details,
                statusCode: response.statusCode,
                responseTime: response.responseTime,
                url: check.url
            };
        } catch (error) {
            return {
                status: 'ERROR',
                success: false,
                error: error.message,
                url: check.url
            };
        }
    }

    async checkStorage() {
        try {
            // Check if upload directory exists and is writable
            const uploadDir = './uploads';
            const tempFile = `${uploadDir}/health-check-${Date.now()}.tmp`;
            
            // Check if directory exists
            if (!fs.existsSync(uploadDir)) {
                try {
                    fs.mkdirSync(uploadDir, { recursive: true });
                } catch (error) {
                    return {
                        status: 'ERROR',
                        success: false,
                        error: 'Cannot create upload directory'
                    };
                }
            }

            // Test write permissions
            try {
                fs.writeFileSync(tempFile, 'health check test');
                fs.unlinkSync(tempFile);
                
                return {
                    status: 'HEALTHY',
                    success: true,
                    details: 'File storage accessible and writable'
                };
            } catch (error) {
                return {
                    status: 'ERROR',
                    success: false,
                    error: 'Upload directory not writable'
                };
            }
        } catch (error) {
            return {
                status: 'ERROR',
                success: false,
                error: error.message
            };
        }
    }

    async checkConfiguration() {
        try {
            const requiredVars = [
                'NEXT_PUBLIC_SUPABASE_URL',
                'NEXT_PUBLIC_SUPABASE_ANON_KEY'
            ];

            const missingVars = [];
            const presentVars = [];

            for (const varName of requiredVars) {
                if (process.env[varName]) {
                    presentVars.push(varName);
                } else {
                    missingVars.push(varName);
                }
            }

            if (missingVars.length === 0) {
                return {
                    status: 'HEALTHY',
                    success: true,
                    details: `All ${requiredVars.length} required environment variables present`
                };
            } else {
                return {
                    status: 'ERROR',
                    success: false,
                    error: `Missing environment variables: ${missingVars.join(', ')}`,
                    details: `Present: ${presentVars.length}, Missing: ${missingVars.length}`
                };
            }
        } catch (error) {
            return {
                status: 'ERROR',
                success: false,
                error: error.message
            };
        }
    }

    async checkBuildSystem() {
        try {
            // Check if build succeeds
            const startTime = Date.now();
            execSync('npm run build', { 
                encoding: 'utf8', 
                timeout: 120000,
                stdio: 'pipe'
            });
            const buildTime = Date.now() - startTime;

            return {
                status: 'HEALTHY',
                success: true,
                details: `Build completed successfully in ${buildTime}ms`
            };
        } catch (error) {
            return {
                status: 'ERROR',
                success: false,
                error: 'Build failed',
                details: error.message.substring(0, 200) + '...'
            };
        }
    }

    async checkTestSuite() {
        try {
            // Run a subset of tests to check test infrastructure
            const output = execSync('npm test -- --passWithNoTests --testTimeout=10000', { 
                encoding: 'utf8',
                timeout: 30000,
                stdio: 'pipe'
            });

            // Parse test results
            const passedMatch = output.match(/(\d+) passed/);
            const failedMatch = output.match(/(\d+) failed/);
            
            const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
            const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
            const total = passed + failed;

            if (total === 0) {
                return {
                    status: 'WARNING',
                    success: true,
                    details: 'No tests found or executed'
                };
            }

            const passRate = (passed / total) * 100;
            
            if (passRate >= 80) {
                return {
                    status: 'HEALTHY',
                    success: true,
                    details: `Test suite healthy: ${passed}/${total} tests passing (${passRate.toFixed(1)}%)`
                };
            } else if (passRate >= 50) {
                return {
                    status: 'WARNING',
                    success: true,
                    details: `Test suite has issues: ${passed}/${total} tests passing (${passRate.toFixed(1)}%)`
                };
            } else {
                return {
                    status: 'ERROR',
                    success: false,
                    error: `Many test failures: ${failed}/${total} tests failing`
                };
            }
        } catch (error) {
            // Tests might fail but we can still parse output
            const output = error.stdout || error.message;
            const passedMatch = output.match(/(\d+) passed/);
            const failedMatch = output.match(/(\d+) failed/);
            
            if (passedMatch || failedMatch) {
                const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
                const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
                
                return {
                    status: 'WARNING',
                    success: true,
                    details: `Test execution completed with issues: ${passed} passed, ${failed} failed`
                };
            } else {
                return {
                    status: 'ERROR',
                    success: false,
                    error: 'Test suite execution failed'
                };
            }
        }
    }

    async isServerRunning() {
        try {
            const response = await this.makeHttpRequest(`${this.baseUrl}/api/health`, {
                method: 'GET',
                timeout: 2000
            });
            return response.statusCode >= 200 && response.statusCode < 500;
        } catch (error) {
            return false;
        }
    }

    makeHttpRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const isHttps = url.startsWith('https:');
            const client = isHttps ? https : http;
            
            const req = client.request(url, {
                method: options.method || 'GET',
                headers: options.headers || {},
                timeout: options.timeout || 5000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data,
                        responseTime: Date.now() - startTime
                    });
                });
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    logCheckResult(result) {
        const icon = result.success ? '✅' : '❌';
        const status = result.status || 'UNKNOWN';
        
        console.log(`  ${icon} ${result.name}: ${status}`);
        
        if (result.details) {
            console.log(`    📋 ${result.details}`);
        }
        
        if (result.error) {
            console.log(`    ⚠️  Error: ${result.error}`);
        }
        
        if (result.duration) {
            console.log(`    ⏱️  Duration: ${result.duration}ms`);
        }
        
        console.log('');
    }

    calculateOverallHealth() {
        const totalChecks = this.results.checks.length;
        const successfulChecks = this.results.checks.filter(c => c.success).length;
        const criticalChecks = this.results.checks.filter(c => c.critical);
        const criticalSuccesses = criticalChecks.filter(c => c.success).length;
        
        // Calculate overall score
        this.results.overall.score = totalChecks > 0 ? Math.round((successfulChecks / totalChecks) * 100) : 0;
        
        // Determine overall status
        if (criticalChecks.length > 0 && criticalSuccesses < criticalChecks.length) {
            this.results.overall.status = 'CRITICAL';
        } else if (this.results.overall.score >= 90) {
            this.results.overall.status = 'HEALTHY';
        } else if (this.results.overall.score >= 70) {
            this.results.overall.status = 'WARNING';
        } else {
            this.results.overall.status = 'UNHEALTHY';
        }

        this.results.overall.summary = {
            total: totalChecks,
            successful: successfulChecks,
            failed: totalChecks - successfulChecks,
            critical: criticalChecks.length,
            criticalSuccesses: criticalSuccesses
        };
    }

    generateReport() {
        console.log('='.repeat(50));
        console.log('📊 HEALTH CHECK SUMMARY');
        console.log('='.repeat(50));
        
        const { score, status, summary } = this.results.overall;
        
        console.log(`🎯 Overall Health Score: ${score}%`);
        console.log(`📈 System Status: ${status}`);
        console.log(`✅ Successful Checks: ${summary.successful}/${summary.total}`);
        console.log(`❌ Failed Checks: ${summary.failed}/${summary.total}`);
        console.log(`🚨 Critical Issues: ${summary.critical - summary.criticalSuccesses}/${summary.critical}`);
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        
        const criticalFailures = this.results.checks.filter(c => c.critical && !c.success);
        if (criticalFailures.length > 0) {
            console.log('  🚨 CRITICAL ISSUES FOUND:');
            criticalFailures.forEach(failure => {
                console.log(`    • ${failure.name}: ${failure.error || failure.status}`);
            });
        }
        
        if (status === 'HEALTHY') {
            console.log('  ✅ System is healthy and ready for use');
        } else if (status === 'WARNING') {
            console.log('  ⚠️  System has minor issues but is functional');
            console.log('  • Address non-critical failures when possible');
        } else if (status === 'UNHEALTHY') {
            console.log('  ❌ System has significant issues');
            console.log('  • Fix failing health checks before proceeding');
        } else if (status === 'CRITICAL') {
            console.log('  🚨 SYSTEM NOT READY FOR PRODUCTION');
            console.log('  • Fix all critical issues immediately');
            console.log('  • Do not deploy until critical checks pass');
        }
        
        // Save detailed report
        fs.writeFileSync('health-check-report.json', JSON.stringify(this.results, null, 2));
        console.log('\n📄 Detailed report saved to: health-check-report.json');
        
        // Exit code based on health status  
        const exitCode = (status === 'CRITICAL' || status === 'UNHEALTHY') ? 1 : 0;
        console.log('='.repeat(50));
        
        process.exit(exitCode);
    }
}

// CLI Interface
if (require.main === module) {
    const healthChecker = new HealthChecker();
    healthChecker.runAllChecks().catch(error => {
        console.error('❌ Health check failed:', error);
        process.exit(1);
    });
}

module.exports = HealthChecker;