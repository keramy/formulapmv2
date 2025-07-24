#!/usr/bin/env node

/**
 * Deployment Configuration Analyzer
 * Analyzes deployment configuration and environment management in the codebase
 */

const fs = require('fs');
const path = require('path');

class DeploymentConfigAnalyzer {
  constructor() {
    this.results = {
      vercelConfig: null,
      envVariables: [],
      secretsManagement: [],
      deploymentScripts: [],
      infrastructureConfig: [],
      issues: [],
      recommendations: []
    };

    // Files to check
    this.configFiles = [
      'vercel.json',
      '.env.example',
      '.env.local',
      '.env.development',
      '.env.production',
      '.env.test',
      'next.config.js',
      'package.json',
      'tsconfig.json',
      'jest.config.js',
      '.gitignore'
    ];
  }

  /**
   * Main execution method
   */
  async execute() {
    console.log('🔍 ANALYZING DEPLOYMENT CONFIGURATION');
    console.log('===================================');
    console.log('Scanning codebase for deployment configuration and environment management...');

    // Check Vercel configuration
    console.log('\nChecking Vercel configuration...');
    this.checkVercelConfig();
    
    // Check environment variables
    console.log('Checking environment variables...');
    this.checkEnvironmentVariables();
    
    // Check secrets management
    console.log('Checking secrets management...');
    this.checkSecretsManagement();
    
    // Check deployment scripts
    console.log('Checking deployment scripts...');
    this.checkDeploymentScripts();
    
    // Check infrastructure configuration
    console.log('Checking infrastructure configuration...');
    this.checkInfrastructureConfig();
    
    // Identify issues and recommendations
    console.log('Identifying issues and recommendations...');
    this.identifyIssuesAndRecommendations();

    // Generate report
    this.generateReport();

    return this.results;
  }

  /**
   * Check Vercel configuration
   */
  checkVercelConfig() {
    try {
      if (fs.existsSync('vercel.json')) {
        const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        
        this.results.vercelConfig = {
          file: 'vercel.json',
          hasConfig: true,
          config: vercelConfig,
          issues: []
        };
        
        // Check for common issues
        if (!vercelConfig.version) {
          this.results.vercelConfig.issues.push('Missing version field');
        }
        
        if (!vercelConfig.builds) {
          this.results.vercelConfig.issues.push('Missing builds configuration');
        }
        
        if (!vercelConfig.routes) {
          this.results.vercelConfig.issues.push('Missing routes configuration');
        }
      } else {
        this.results.vercelConfig = {
          file: 'vercel.json',
          hasConfig: false,
          config: null,
          issues: ['vercel.json file not found']
        };
      }
    } catch (error) {
      console.error('Error checking Vercel configuration:', error.message);
      this.results.vercelConfig = {
        file: 'vercel.json',
        hasConfig: false,
        config: null,
        issues: [`Error: ${error.message}`]
      };
    }
  }

  /**
   * Check environment variables
   */
  checkEnvironmentVariables() {
    try {
      // Check .env files
      const envFiles = [
        '.env.example',
        '.env.local',
        '.env.development',
        '.env.production',
        '.env.test'
      ];
      
      for (const file of envFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const lines = content.split('\n').filter(line => line.trim() !== '' && !line.startsWith('#'));
          
          const envVars = lines.map(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            return match ? { name: match[1], hasValue: match[2].trim() !== '' } : null;
          }).filter(Boolean);
          
          this.results.envVariables.push({
            file: file,
            exists: true,
            variables: envVars,
            count: envVars.length
          });
        } else {
          this.results.envVariables.push({
            file: file,
            exists: false,
            variables: [],
            count: 0
          });
        }
      }
      
      // Check next.config.js for environment variables
      if (fs.existsSync('next.config.js')) {
        const content = fs.readFileSync('next.config.js', 'utf8');
        
        // Check for env configuration
        const hasEnvConfig = content.includes('env:') || content.includes('publicRuntimeConfig:') || content.includes('serverRuntimeConfig:');
        
        if (hasEnvConfig) {
          this.results.envVariables.push({
            file: 'next.config.js',
            exists: true,
            hasEnvConfig: true,
            note: 'Contains environment variable configuration'
          });
        }
      }
    } catch (error) {
      console.error('Error checking environment variables:', error.message);
    }
  }

  /**
   * Check secrets management
   */
  checkSecretsManagement() {
    try {
      // Check .gitignore for .env files
      if (fs.existsSync('.gitignore')) {
        const content = fs.readFileSync('.gitignore', 'utf8');
        const lines = content.split('\n');
        
        const hasEnvIgnore = lines.some(line => 
          line.trim() === '.env' || 
          line.trim() === '.env.local' || 
          line.trim() === '.env.*'
        );
        
        this.results.secretsManagement.push({
          file: '.gitignore',
          exists: true,
          hasEnvIgnore: hasEnvIgnore,
          note: hasEnvIgnore ? 'Properly ignores .env files' : 'Does not ignore all .env files'
        });
      } else {
        this.results.secretsManagement.push({
          file: '.gitignore',
          exists: false,
          hasEnvIgnore: false,
          note: '.gitignore file not found'
        });
      }
      
      // Check for hardcoded secrets in source files
      const sourceFiles = this.findFilesInDirectory('src', ['.ts', '.tsx', '.js', '.jsx']);
      let hardcodedSecrets = 0;
      
      for (const file of sourceFiles) {
        const content = fs.readFileSync(file, 'utf8');
        
        // Check for common secret patterns
        const hasApiKey = content.includes('apiKey') || content.includes('api_key') || content.includes('API_KEY');
        const hasSecret = content.includes('secret') || content.includes('SECRET');
        const hasPassword = content.includes('password') || content.includes('PASSWORD');
        const hasToken = content.includes('token') || content.includes('TOKEN');
        
        if (hasApiKey || hasSecret || hasPassword || hasToken) {
          // Check if it's likely a hardcoded secret (not using process.env)
          const lines = content.split('\n');
          
          for (const line of lines) {
            if ((hasApiKey && line.includes('apiKey') && !line.includes('process.env')) ||
                (hasSecret && line.includes('secret') && !line.includes('process.env')) ||
                (hasPassword && line.includes('password') && !line.includes('process.env')) ||
                (hasToken && line.includes('token') && !line.includes('process.env'))) {
              
              // Ignore common false positives
              if (!line.includes('placeholder') && 
                  !line.includes('interface') && 
                  !line.includes('type ') && 
                  !line.includes('import') && 
                  !line.includes('//')) {
                hardcodedSecrets++;
                
                this.results.secretsManagement.push({
                  file: file,
                  line: line.trim(),
                  issue: 'Potential hardcoded secret'
                });
                
                break;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking secrets management:', error.message);
    }
  }

  /**
   * Check deployment scripts
   */
  checkDeploymentScripts() {
    try {
      // Check package.json for deployment scripts
      if (fs.existsSync('package.json')) {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        if (packageJson.scripts) {
          const deploymentScripts = [];
          
          for (const [name, script] of Object.entries(packageJson.scripts)) {
            if (name.includes('deploy') || 
                name.includes('build') || 
                name.includes('start') || 
                name.includes('vercel') || 
                name.includes('netlify') || 
                name.includes('aws') || 
                name.includes('azure') || 
                name.includes('gcp')) {
              
              deploymentScripts.push({
                name: name,
                script: script
              });
            }
          }
          
          this.results.deploymentScripts.push({
            file: 'package.json',
            exists: true,
            scripts: deploymentScripts,
            count: deploymentScripts.length
          });
        }
      }
      
      // Check for deployment-related files
      const deploymentFiles = [
        'Dockerfile',
        'docker-compose.yml',
        '.github/workflows/deploy.yml',
        '.github/workflows/main.yml',
        '.gitlab-ci.yml',
        'netlify.toml',
        'firebase.json',
        'serverless.yml'
      ];
      
      for (const file of deploymentFiles) {
        if (fs.existsSync(file)) {
          this.results.deploymentScripts.push({
            file: file,
            exists: true,
            note: `Found ${file}`
          });
        }
      }
    } catch (error) {
      console.error('Error checking deployment scripts:', error.message);
    }
  }

  /**
   * Check infrastructure configuration
   */
  checkInfrastructureConfig() {
    try {
      // Check for infrastructure configuration files
      const infraFiles = [
        'terraform.tf',
        'terraform.tfvars',
        'cloudformation.yml',
        'cloudformation.json',
        'k8s',
        'kubernetes',
        'helm',
        'ansible',
        'pulumi'
      ];
      
      for (const file of infraFiles) {
        const filePath = path.join('.', file);
        
        if (fs.existsSync(filePath)) {
          let type = 'unknown';
          
          if (file.includes('terraform')) type = 'Terraform';
          else if (file.includes('cloudformation')) type = 'CloudFormation';
          else if (file.includes('k8s') || file.includes('kubernetes')) type = 'Kubernetes';
          else if (file.includes('helm')) type = 'Helm';
          else if (file.includes('ansible')) type = 'Ansible';
          else if (file.includes('pulumi')) type = 'Pulumi';
          
          this.results.infrastructureConfig.push({
            file: filePath,
            exists: true,
            type: type,
            note: `Found ${type} configuration`
          });
        }
      }
      
      // Check for database migration files
      const migrationDirs = [
        'migrations',
        'db/migrations',
        'prisma/migrations',
        'src/migrations'
      ];
      
      for (const dir of migrationDirs) {
        if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
          const files = fs.readdirSync(dir);
          
          this.results.infrastructureConfig.push({
            file: dir,
            exists: true,
            type: 'Database Migrations',
            count: files.length,
            note: `Found ${files.length} migration files`
          });
        }
      }
    } catch (error) {
      console.error('Error checking infrastructure configuration:', error.message);
    }
  }

  /**
   * Identify issues and recommendations
   */
  identifyIssuesAndRecommendations() {
    // Check for missing Vercel configuration
    if (!this.results.vercelConfig || !this.results.vercelConfig.hasConfig) {
      this.results.issues.push({
        severity: 'High',
        issue: 'Missing Vercel configuration file',
        impact: 'May cause deployment issues and inconsistent behavior'
      });
      
      this.results.recommendations.push({
        priority: 'High',
        recommendation: 'Create a vercel.json file with appropriate configuration',
        details: 'Include version, builds, and routes sections'
      });
    } else if (this.results.vercelConfig.issues.length > 0) {
      this.results.issues.push({
        severity: 'Medium',
        issue: 'Incomplete Vercel configuration',
        details: this.results.vercelConfig.issues.join(', '),
        impact: 'May cause partial deployment issues'
      });
      
      this.results.recommendations.push({
        priority: 'Medium',
        recommendation: 'Complete the Vercel configuration',
        details: `Address: ${this.results.vercelConfig.issues.join(', ')}`
      });
    }
    
    // Check for missing environment variable files
    const missingEnvFiles = this.results.envVariables.filter(item => !item.exists);
    
    if (missingEnvFiles.length > 0) {
      this.results.issues.push({
        severity: 'Medium',
        issue: 'Missing environment variable files',
        details: missingEnvFiles.map(item => item.file).join(', '),
        impact: 'May cause configuration issues across environments'
      });
      
      this.results.recommendations.push({
        priority: 'Medium',
        recommendation: 'Create missing environment variable files',
        details: `Create: ${missingEnvFiles.map(item => item.file).join(', ')}`
      });
    }
    
    // Check for .env.example
    const envExample = this.results.envVariables.find(item => item.file === '.env.example');
    
    if (!envExample || !envExample.exists) {
      this.results.issues.push({
        severity: 'Medium',
        issue: 'Missing .env.example file',
        impact: 'Makes it difficult for new developers to set up the project'
      });
      
      this.results.recommendations.push({
        priority: 'Medium',
        recommendation: 'Create a .env.example file with all required variables',
        details: 'Include all required variables with placeholder values'
      });
    }
    
    // Check for secrets management issues
    const gitignoreCheck = this.results.secretsManagement.find(item => item.file === '.gitignore');
    
    if (!gitignoreCheck || !gitignoreCheck.exists || !gitignoreCheck.hasEnvIgnore) {
      this.results.issues.push({
        severity: 'Critical',
        issue: 'Environment files not properly ignored in version control',
        impact: 'Risk of leaking secrets and credentials'
      });
      
      this.results.recommendations.push({
        priority: 'Critical',
        recommendation: 'Update .gitignore to exclude all .env files',
        details: 'Add .env, .env.local, and .env.* to .gitignore'
      });
    }
    
    // Check for hardcoded secrets
    const hardcodedSecrets = this.results.secretsManagement.filter(item => item.issue === 'Potential hardcoded secret');
    
    if (hardcodedSecrets.length > 0) {
      this.results.issues.push({
        severity: 'Critical',
        issue: 'Potential hardcoded secrets found in source code',
        count: hardcodedSecrets.length,
        impact: 'Security vulnerability that could expose sensitive information'
      });
      
      this.results.recommendations.push({
        priority: 'Critical',
        recommendation: 'Move hardcoded secrets to environment variables',
        details: `Check ${hardcodedSecrets.length} locations with potential hardcoded secrets`
      });
    }
    
    // Check for deployment scripts
    const packageJsonScripts = this.results.deploymentScripts.find(item => item.file === 'package.json');
    
    if (!packageJsonScripts || !packageJsonScripts.exists || packageJsonScripts.count === 0) {
      this.results.issues.push({
        severity: 'Medium',
        issue: 'Missing deployment scripts in package.json',
        impact: 'Makes deployment process manual and error-prone'
      });
      
      this.results.recommendations.push({
        priority: 'Medium',
        recommendation: 'Add deployment scripts to package.json',
        details: 'Include build, start, and deploy scripts'
      });
    }
    
    // Check for CI/CD configuration
    const cicdFiles = this.results.deploymentScripts.filter(item => 
      item.file.includes('.github/workflows') || 
      item.file.includes('.gitlab-ci.yml')
    );
    
    if (cicdFiles.length === 0) {
      this.results.issues.push({
        severity: 'Medium',
        issue: 'Missing CI/CD configuration',
        impact: 'No automated testing and deployment pipeline'
      });
      
      this.results.recommendations.push({
        priority: 'Medium',
        recommendation: 'Set up CI/CD pipeline with GitHub Actions or GitLab CI',
        details: 'Configure automated testing, building, and deployment'
      });
    }
    
    // Check for infrastructure as code
    if (this.results.infrastructureConfig.length === 0) {
      this.results.issues.push({
        severity: 'Low',
        issue: 'No infrastructure as code configuration found',
        impact: 'Infrastructure management is manual and not version controlled'
      });
      
      this.results.recommendations.push({
        priority: 'Low',
        recommendation: 'Consider using infrastructure as code tools',
        details: 'Terraform, CloudFormation, or Pulumi for infrastructure management'
      });
    }
    
    // Check for database migrations
    const migrationConfigs = this.results.infrastructureConfig.filter(item => item.type === 'Database Migrations');
    
    if (migrationConfigs.length === 0) {
      this.results.issues.push({
        severity: 'Medium',
        issue: 'No database migration system found',
        impact: 'Database schema changes are manual and error-prone'
      });
      
      this.results.recommendations.push({
        priority: 'Medium',
        recommendation: 'Implement a database migration system',
        details: 'Use Prisma, TypeORM, or custom migration scripts'
      });
    }
  }

  /**
   * Find files in directory
   */
  findFilesInDirectory(dir, extensions) {
    let results = [];
    
    try {
      if (!fs.existsSync(dir)) {
        return results;
      }
      
      const list = fs.readdirSync(dir);
      
      for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
            results = results.concat(this.findFilesInDirectory(filePath, extensions));
          }
        } else {
          const ext = path.extname(file);
          if (extensions.includes(ext)) {
            results.push(filePath);
          }
        }
      }
    } catch (error) {
      console.error(`Error finding files in ${dir}:`, error.message);
    }
    
    return results;
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n📊 DEPLOYMENT CONFIGURATION ANALYSIS REPORT');
    console.log('=======================================');
    
    // Vercel configuration
    console.log('\n🔵 VERCEL CONFIGURATION');
    console.log('=====================');
    
    if (this.results.vercelConfig && this.results.vercelConfig.hasConfig) {
      console.log('✅ Vercel configuration found');
      
      if (this.results.vercelConfig.issues.length > 0) {
        console.log('\nIssues:');
        for (const issue of this.results.vercelConfig.issues) {
          console.log(`  - ${issue}`);
        }
      } else {
        console.log('  No issues found');
      }
    } else {
      console.log('❌ Vercel configuration not found');
    }
    
    // Environment variables
    console.log('\n🟢 ENVIRONMENT VARIABLES');
    console.log('=====================');
    
    const existingEnvFiles = this.results.envVariables.filter(item => item.exists);
    const missingEnvFiles = this.results.envVariables.filter(item => !item.exists);
    
    if (existingEnvFiles.length > 0) {
      console.log('Environment files found:');
      
      for (const item of existingEnvFiles) {
        if (item.variables) {
          console.log(`  - ${item.file}: ${item.count} variables`);
        } else if (item.hasEnvConfig) {
          console.log(`  - ${item.file}: ${item.note}`);
        }
      }
    }
    
    if (missingEnvFiles.length > 0) {
      console.log('\nMissing environment files:');
      
      for (const item of missingEnvFiles) {
        console.log(`  - ${item.file}`);
      }
    }
    
    // Secrets management
    console.log('\n🔴 SECRETS MANAGEMENT');
    console.log('===================');
    
    const gitignoreCheck = this.results.secretsManagement.find(item => item.file === '.gitignore');
    
    if (gitignoreCheck) {
      if (gitignoreCheck.hasEnvIgnore) {
        console.log('✅ .env files properly ignored in version control');
      } else {
        console.log('❌ .env files not properly ignored in version control');
      }
    } else {
      console.log('❌ .gitignore file not found');
    }
    
    const hardcodedSecrets = this.results.secretsManagement.filter(item => item.issue === 'Potential hardcoded secret');
    
    if (hardcodedSecrets.length > 0) {
      console.log(`\n⚠️ Found ${hardcodedSecrets.length} potential hardcoded secrets:`);
      
      for (const item of hardcodedSecrets.slice(0, 5)) {
        console.log(`  - ${item.file}: ${item.line}`);
      }
      
      if (hardcodedSecrets.length > 5) {
        console.log(`  ... and ${hardcodedSecrets.length - 5} more`);
      }
    } else {
      console.log('\n✅ No potential hardcoded secrets found');
    }
    
    // Deployment scripts
    console.log('\n🟣 DEPLOYMENT SCRIPTS');
    console.log('==================');
    
    const packageJsonScripts = this.results.deploymentScripts.find(item => item.file === 'package.json');
    
    if (packageJsonScripts && packageJsonScripts.exists) {
      console.log(`Found ${packageJsonScripts.count} deployment-related scripts in package.json:`);
      
      for (const script of packageJsonScripts.scripts) {
        console.log(`  - ${script.name}: ${script.script}`);
      }
    } else {
      console.log('❌ No deployment scripts found in package.json');
    }
    
    const otherDeploymentFiles = this.results.deploymentScripts.filter(item => item.file !== 'package.json');
    
    if (otherDeploymentFiles.length > 0) {
      console.log('\nOther deployment configuration files:');
      
      for (const item of otherDeploymentFiles) {
        console.log(`  - ${item.file}`);
      }
    } else {
      console.log('\n❌ No other deployment configuration files found');
    }
    
    // Infrastructure configuration
    console.log('\n🟠 INFRASTRUCTURE CONFIGURATION');
    console.log('===========================');
    
    if (this.results.infrastructureConfig.length > 0) {
      console.log('Infrastructure configuration found:');
      
      for (const item of this.results.infrastructureConfig) {
        console.log(`  - ${item.file} (${item.type})`);
        if (item.count) {
          console.log(`    ${item.note}`);
        }
      }
    } else {
      console.log('❌ No infrastructure configuration found');
    }
    
    // Issues and recommendations
    console.log('\n⚠️ ISSUES');
    console.log('========');
    
    if (this.results.issues.length > 0) {
      // Group by severity
      const criticalIssues = this.results.issues.filter(item => item.severity === 'Critical');
      const highIssues = this.results.issues.filter(item => item.severity === 'High');
      const mediumIssues = this.results.issues.filter(item => item.severity === 'Medium');
      const lowIssues = this.results.issues.filter(item => item.severity === 'Low');
      
      if (criticalIssues.length > 0) {
        console.log('\nCritical Issues:');
        
        for (const issue of criticalIssues) {
          console.log(`  - ${issue.issue}`);
          console.log(`    Impact: ${issue.impact}`);
          if (issue.details) {
            console.log(`    Details: ${issue.details}`);
          }
        }
      }
      
      if (highIssues.length > 0) {
        console.log('\nHigh Issues:');
        
        for (const issue of highIssues) {
          console.log(`  - ${issue.issue}`);
          console.log(`    Impact: ${issue.impact}`);
          if (issue.details) {
            console.log(`    Details: ${issue.details}`);
          }
        }
      }
      
      if (mediumIssues.length > 0) {
        console.log('\nMedium Issues:');
        
        for (const issue of mediumIssues) {
          console.log(`  - ${issue.issue}`);
          console.log(`    Impact: ${issue.impact}`);
          if (issue.details) {
            console.log(`    Details: ${issue.details}`);
          }
        }
      }
      
      if (lowIssues.length > 0) {
        console.log('\nLow Issues:');
        
        for (const issue of lowIssues) {
          console.log(`  - ${issue.issue}`);
          console.log(`    Impact: ${issue.impact}`);
          if (issue.details) {
            console.log(`    Details: ${issue.details}`);
          }
        }
      }
    } else {
      console.log('✅ No issues found');
    }
    
    console.log('\n💡 RECOMMENDATIONS');
    console.log('================');
    
    if (this.results.recommendations.length > 0) {
      // Group by priority
      const criticalRecs = this.results.recommendations.filter(item => item.priority === 'Critical');
      const highRecs = this.results.recommendations.filter(item => item.priority === 'High');
      const mediumRecs = this.results.recommendations.filter(item => item.priority === 'Medium');
      const lowRecs = this.results.recommendations.filter(item => item.priority === 'Low');
      
      if (criticalRecs.length > 0) {
        console.log('\nCritical Priority:');
        
        for (const rec of criticalRecs) {
          console.log(`  - ${rec.recommendation}`);
          if (rec.details) {
            console.log(`    ${rec.details}`);
          }
        }
      }
      
      if (highRecs.length > 0) {
        console.log('\nHigh Priority:');
        
        for (const rec of highRecs) {
          console.log(`  - ${rec.recommendation}`);
          if (rec.details) {
            console.log(`    ${rec.details}`);
          }
        }
      }
      
      if (mediumRecs.length > 0) {
        console.log('\nMedium Priority:');
        
        for (const rec of mediumRecs) {
          console.log(`  - ${rec.recommendation}`);
          if (rec.details) {
            console.log(`    ${rec.details}`);
          }
        }
      }
      
      if (lowRecs.length > 0) {
        console.log('\nLow Priority:');
        
        for (const rec of lowRecs) {
          console.log(`  - ${rec.recommendation}`);
          if (rec.details) {
            console.log(`    ${rec.details}`);
          }
        }
      }
    } else {
      console.log('✅ No recommendations needed');
    }
    
    // Summary
    console.log('\n🎯 SUMMARY');
    console.log('=========');
    
    const criticalIssues = this.results.issues.filter(item => item.severity === 'Critical').length;
    const highIssues = this.results.issues.filter(item => item.severity === 'High').length;
    const mediumIssues = this.results.issues.filter(item => item.severity === 'Medium').length;
    const lowIssues = this.results.issues.filter(item => item.severity === 'Low').length;
    
    console.log(`Total issues: ${this.results.issues.length}`);
    console.log(`  - Critical: ${criticalIssues}`);
    console.log(`  - High: ${highIssues}`);
    console.log(`  - Medium: ${mediumIssues}`);
    console.log(`  - Low: ${lowIssues}`);
    
    // Overall assessment
    let overallAssessment = 'Good';
    
    if (criticalIssues > 0) {
      overallAssessment = 'Poor';
    } else if (highIssues > 0) {
      overallAssessment = 'Fair';
    } else if (mediumIssues > 2) {
      overallAssessment = 'Fair';
    }
    
    console.log(`\nOverall deployment configuration: ${overallAssessment}`);
    
    // Save detailed results to file
    this.saveResultsToFile('scripts/deployment-config-results.json');
  }

  /**
   * Save results to file
   */
  saveResultsToFile(filePath) {
    fs.writeFileSync(filePath, JSON.stringify(this.results, null, 2));
    console.log(`\nDetailed results saved to ${filePath}`);
  }
}

// Execute if run directly
if (require.main === module) {
  const analyzer = new DeploymentConfigAnalyzer();
  
  analyzer.execute()
    .then(results => {
      console.log('\n🏁 Analysis completed.');
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { DeploymentConfigAnalyzer };