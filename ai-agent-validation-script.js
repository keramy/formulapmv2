/**
 * AI Agent Validation Script
 * Quick validation of all completed optimizations and remaining work
 */

const fs = require('fs');
const path = require('path');

class AIAgentValidator {
  constructor() {
    this.results = {
      apiRoutes: { migrated: 0, total: 0, remaining: [] },
      components: { migrated: 0, total: 0, remaining: [] },
      forms: { migrated: 0, total: 0, remaining: [] },
      hooks: { migrated: 0, total: 0, remaining: [] },
      errors: []
    };
  }

  async validateAll() {
    console.log('🤖 AI AGENT VALIDATION STARTING...\n');
    
    try {
      await this.validateApiRoutes();
      await this.validateComponents();
      await this.validateForms();
      await this.validateHooks();
      
      this.generateValidationReport();
      
    } catch (error) {
      console.error('❌ Validation error:', error);
    }
  }

  async validateApiRoutes() {
    console.log('🔐 VALIDATING API ROUTES...');
    
    const apiRoutes = this.getAllFiles(['src/app/api'], ['.ts']);
    this.results.apiRoutes.total = apiRoutes.length;
    
    let migratedCount = 0;
    const remaining = [];
    
    for (const route of apiRoutes) {
      const content = fs.readFileSync(route, 'utf8');
      
      const hasWithAuth = content.includes('withAuth');
      const hasCreateErrorResponse = content.includes('createErrorResponse');
      const hasCreateSuccessResponse = content.includes('createSuccessResponse');
      const hasOldPattern = content.includes('const { user, profile, error } = await verifyAuth(request)');

      // Route is optimized if it uses withAuth OR standardized response patterns
      const isOptimized = (hasWithAuth && hasCreateErrorResponse && !hasOldPattern) ||
                         (hasCreateErrorResponse && hasCreateSuccessResponse && !hasOldPattern);

      if (isOptimized) {
        migratedCount++;
        console.log(`  ✅ ${route}`);
      } else if (hasOldPattern || content.includes('verifyAuth')) {
        remaining.push(route);
        console.log(`  🔄 ${route} - Needs migration`);
      } else {
        console.log(`  ⏭️  ${route} - No auth pattern`);
      }
    }
    
    this.results.apiRoutes.migrated = migratedCount;
    this.results.apiRoutes.remaining = remaining;
    
    console.log(`📊 API Routes: ${migratedCount}/${apiRoutes.length} migrated, ${remaining.length} remaining\n`);
  }

  async validateComponents() {
    console.log('🧩 VALIDATING COMPONENTS...');
    
    const components = this.getAllFiles(['src/components'], ['.tsx']);
    this.results.components.total = components.length;
    
    let migratedCount = 0;
    const remaining = [];
    
    for (const component of components) {
      const content = fs.readFileSync(component, 'utf8');
      
      const hasDataStateWrapper = content.includes('DataStateWrapper');
      const hasManualLoading = content.includes('if (loading)') || 
                               content.includes('if (error)') ||
                               content.includes('if.*loading.*return');
      
      if (hasDataStateWrapper) {
        migratedCount++;
        console.log(`  ✅ ${component}`);
      } else if (hasManualLoading) {
        remaining.push(component);
        console.log(`  🔄 ${component} - Has manual loading states`);
      }
    }
    
    this.results.components.migrated = migratedCount;
    this.results.components.remaining = remaining;
    
    console.log(`📊 Components: ${migratedCount}/${components.length} using DataStateWrapper, ${remaining.length} with manual states\n`);
  }

  async validateForms() {
    console.log('📝 VALIDATING FORMS...');
    
    const allFiles = this.getAllFiles(['src/components'], ['.tsx']);
    const forms = allFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      return content.includes('useForm') || content.includes('<form') || content.includes('Form');
    });
    
    this.results.forms.total = forms.length;
    
    let migratedCount = 0;
    const remaining = [];
    
    for (const form of forms) {
      const content = fs.readFileSync(form, 'utf8');
      
      const hasCentralizedValidation = content.includes('projectSchemas') ||
                                       content.includes('validateData') ||
                                       content.includes('FormValidator') ||
                                       content.includes('FormBuilder') ||
                                       content.includes('SimpleFormBuilder') ||
                                       (content.includes('z.object') && content.includes('schema'));
      
      const hasManualValidation = content.includes('setErrors') ||
                                  content.includes('validation') ||
                                  content.includes('validate');
      
      if (hasCentralizedValidation) {
        migratedCount++;
        console.log(`  ✅ ${form}`);
      } else if (hasManualValidation) {
        remaining.push(form);
        console.log(`  🔄 ${form} - Has manual validation`);
      }
    }
    
    this.results.forms.migrated = migratedCount;
    this.results.forms.remaining = remaining;
    
    console.log(`📊 Forms: ${migratedCount}/${forms.length} using centralized validation, ${remaining.length} with manual validation\n`);
  }

  async validateHooks() {
    console.log('🪝 VALIDATING HOOKS...');
    
    const hooks = this.getAllFiles(['src/hooks'], ['.ts', '.tsx']);
    this.results.hooks.total = hooks.length;
    
    let migratedCount = 0;
    const remaining = [];
    
    for (const hook of hooks) {
      const content = fs.readFileSync(hook, 'utf8');
      
      const hasAdvancedPatterns = content.includes('useAdvancedApiQuery') ||
                                  content.includes('useApiQuery') ||
                                  content.includes('Advanced');
      
      const hasManualStates = content.includes('const [loading, setLoading]') ||
                              content.includes('const [error, setError]');
      
      if (hasAdvancedPatterns) {
        migratedCount++;
        console.log(`  ✅ ${hook}`);
      } else if (hasManualStates) {
        remaining.push(hook);
        console.log(`  🔄 ${hook} - Has manual state management`);
      }
    }
    
    this.results.hooks.migrated = migratedCount;
    this.results.hooks.remaining = remaining;
    
    console.log(`📊 Hooks: ${migratedCount}/${hooks.length} using advanced patterns, ${remaining.length} with manual states\n`);
  }

  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        apiRoutes: {
          migrated: this.results.apiRoutes.migrated,
          total: this.results.apiRoutes.total,
          percentage: Math.round((this.results.apiRoutes.migrated / this.results.apiRoutes.total) * 100),
          remaining: this.results.apiRoutes.remaining.length
        },
        components: {
          migrated: this.results.components.migrated,
          total: this.results.components.total,
          percentage: Math.round((this.results.components.migrated / this.results.components.total) * 100),
          remaining: this.results.components.remaining.length
        },
        forms: {
          migrated: this.results.forms.migrated,
          total: this.results.forms.total,
          percentage: Math.round((this.results.forms.migrated / this.results.forms.total) * 100),
          remaining: this.results.forms.remaining.length
        },
        hooks: {
          migrated: this.results.hooks.migrated,
          total: this.results.hooks.total,
          percentage: Math.round((this.results.hooks.migrated / this.results.hooks.total) * 100),
          remaining: this.results.hooks.remaining.length
        }
      },
      remainingWork: {
        apiRoutes: this.results.apiRoutes.remaining,
        components: this.results.components.remaining,
        forms: this.results.forms.remaining,
        hooks: this.results.hooks.remaining
      },
      nextSteps: this.generateNextSteps()
    };

    fs.writeFileSync('AI_AGENT_VALIDATION_RESULTS.json', JSON.stringify(report, null, 2), 'utf8');

    console.log('🎯 VALIDATION SUMMARY');
    console.log('===================');
    console.log(`📊 API Routes: ${report.summary.apiRoutes.migrated}/${report.summary.apiRoutes.total} (${report.summary.apiRoutes.percentage}%) migrated`);
    console.log(`🧩 Components: ${report.summary.components.migrated}/${report.summary.components.total} (${report.summary.components.percentage}%) using DataStateWrapper`);
    console.log(`📝 Forms: ${report.summary.forms.migrated}/${report.summary.forms.total} (${report.summary.forms.percentage}%) using centralized validation`);
    console.log(`🪝 Hooks: ${report.summary.hooks.migrated}/${report.summary.hooks.total} (${report.summary.hooks.percentage}%) using advanced patterns`);
    
    console.log('\n🚀 NEXT STEPS FOR AI AGENT:');
    report.nextSteps.forEach((step, index) => {
      console.log(`${index + 1}. ${step}`);
    });
    
    console.log(`\n📋 Detailed results saved to: AI_AGENT_VALIDATION_RESULTS.json`);
  }

  generateNextSteps() {
    const steps = [];
    
    if (this.results.apiRoutes.remaining.length > 0) {
      steps.push(`Migrate ${this.results.apiRoutes.remaining.length} remaining API routes to withAuth middleware`);
    }
    
    if (this.results.components.remaining.length > 0) {
      steps.push(`Apply DataStateWrapper to ${this.results.components.remaining.length} components with manual loading states`);
    }
    
    if (this.results.forms.remaining.length > 0) {
      steps.push(`Migrate ${this.results.forms.remaining.length} forms to use centralized validation`);
    }
    
    if (this.results.hooks.remaining.length > 0) {
      steps.push(`Enhance ${this.results.hooks.remaining.length} hooks with advanced patterns`);
    }
    
    steps.push('Run TypeScript compilation to verify all migrations');
    steps.push('Execute performance monitoring to measure improvements');
    steps.push('Test critical user flows to ensure functionality');
    
    return steps;
  }

  getAllFiles(dirs, extensions) {
    const files = [];
    
    const scanDir = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      });
    };
    
    dirs.forEach(scanDir);
    return files;
  }
}

// Execute validation
const validator = new AIAgentValidator();
validator.validateAll();
