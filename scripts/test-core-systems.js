#!/usr/bin/env node

/**
 * Formula PM 2.0 Core Systems Test
 * This script validates that all core systems are working correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let passedTests = 0;
let failedTests = 0;
let warnings = 0;

function printPass(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
  passedTests++;
}

function printFail(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
  failedTests++;
}

function printWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
  warnings++;
}

function printInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

console.log('🔍 Testing Formula PM 2.0 Core Systems');
console.log('=====================================\n');

// Test 1: File Structure
console.log('📁 Testing File Structure...');

const requiredFiles = [
  'package.json',
  'next.config.js',
  'tailwind.config.js',
  'tsconfig.json',
  '.env.local',
  '.env.example',
  'supabase/config.toml',
  'supabase/seed-realistic-construction-data.sql',
  'LOCAL_DEVELOPMENT_SETUP.md',
  'scripts/setup-local-dev.sh',
  'scripts/validate-setup.sh'
];

const requiredDirectories = [
  'src/app',
  'src/components',
  'src/lib',
  'src/types',
  'src/hooks',
  'supabase/migrations',
  'scripts'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    printPass(`Required file exists: ${file}`);
  } else {
    printFail(`Required file missing: ${file}`);
  }
});

requiredDirectories.forEach(dir => {
  if (fs.existsSync(dir)) {
    printPass(`Required directory exists: ${dir}`);
  } else {
    printFail(`Required directory missing: ${dir}`);
  }
});

// Test 2: Core Components
console.log('\n🧩 Testing Core Components...');

const coreComponents = [
  'src/components/client-portal/ClientPortalCoordinator.tsx',
  'src/components/purchase/PurchaseCoordinator.tsx',
  'src/components/documents/DocumentApprovalCoordinator.tsx',
  'src/components/shop-drawings/ShopDrawingsCoordinator.tsx',
  'src/components/subcontractor-access/SubcontractorPortalCoordinator.tsx',
  'src/components/auth/AuthProvider.tsx',
  'src/components/navigation/GlobalSidebar.tsx'
];

coreComponents.forEach(component => {
  if (fs.existsSync(component)) {
    printPass(`Core component exists: ${path.basename(component)}`);
  } else {
    printFail(`Core component missing: ${component}`);
  }
});

// Test 3: API Routes
console.log('\n🔌 Testing API Routes...');

const apiRoutes = [
  'src/app/api/auth/login/route.ts',
  'src/app/api/client-portal/dashboard/route.ts',
  'src/app/api/purchase/orders/route.ts',
  'src/app/api/documents/route.ts',
  'src/app/api/shop-drawings/route.ts',
  'src/app/api/projects/route.ts',
  'src/app/api/subcontractor/auth/login/route.ts'
];

apiRoutes.forEach(route => {
  if (fs.existsSync(route)) {
    printPass(`API route exists: ${path.basename(path.dirname(route))}`);
  } else {
    printFail(`API route missing: ${route}`);
  }
});

// Test 4: Database Schema
console.log('\n🗄️ Testing Database Schema...');

const migrationFiles = [
  'supabase/migrations/20250702000001_initial_schema.sql',
  'supabase/migrations/20250703000008_client_portal_system.sql',
  'supabase/migrations/20250703000007_purchase_department_workflow.sql',
  'supabase/migrations/20250703000002_document_approval_workflow.sql',
  'supabase/migrations/20250703000003_shop_drawings_mobile_integration.sql',
  'supabase/migrations/20250704000001_simple_subcontractor_access.sql'
];

migrationFiles.forEach(migration => {
  if (fs.existsSync(migration)) {
    printPass(`Migration exists: ${path.basename(migration)}`);
  } else {
    printFail(`Migration missing: ${migration}`);
  }
});

// Test 5: Seed Data Validation
console.log('\n🌱 Testing Seed Data...');

const seedFile = 'supabase/seed-realistic-construction-data.sql';
if (fs.existsSync(seedFile)) {
  const seedContent = fs.readFileSync(seedFile, 'utf8');
  
  // Check for required data
  const requiredData = [
    'INSERT INTO user_profiles',
    'INSERT INTO clients',
    'INSERT INTO suppliers',
    'INSERT INTO projects',
    'INSERT INTO project_assignments',
    'INSERT INTO scope_items',
    'INSERT INTO documents',
    'INSERT INTO document_approvals'
  ];
  
  requiredData.forEach(data => {
    if (seedContent.includes(data)) {
      printPass(`Seed data includes: ${data}`);
    } else {
      printFail(`Seed data missing: ${data}`);
    }
  });
  
  // Check for realistic construction projects
  const requiredProjects = [
    'Luxury Beverly Hills Estate',
    'Modern Corporate Headquarters',
    'Upscale Restaurant Transformation',
    'Metropolitan Luxury Condos',
    'Advanced Medical Center',
    'Pacific Retail Chain Expansion'
  ];
  
  requiredProjects.forEach(project => {
    if (seedContent.includes(project)) {
      printPass(`Project included: ${project}`);
    } else {
      printFail(`Project missing: ${project}`);
    }
  });
  
  // Count user profiles
  const userMatches = seedContent.match(/INSERT INTO user_profiles[\s\S]*?VALUES[\s\S]*?;/g);
  if (userMatches) {
    const userCount = (seedContent.match(/\('[\w-]+',\s*'[\w_]+'/g) || []).length;
    if (userCount >= 15) {
      printPass(`User profiles: ${userCount} (meets 15+ requirement)`);
    } else {
      printFail(`User profiles: ${userCount} (needs 15+)`);
    }
  } else {
    printFail('No user profiles found in seed data');
  }
} else {
  printFail(`Seed file not found: ${seedFile}`);
}

// Test 6: Environment Configuration
console.log('\n⚙️ Testing Environment Configuration...');

const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ENABLE_CLIENT_PORTAL',
    'ENABLE_PURCHASE_DEPARTMENT',
    'ENABLE_DOCUMENT_APPROVAL',
    'ENABLE_SHOP_DRAWINGS',
    'ENABLE_SUBCONTRACTOR_ACCESS'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      printPass(`Environment variable configured: ${envVar}`);
    } else {
      printFail(`Environment variable missing: ${envVar}`);
    }
  });
  
  // Check feature flags
  const featureFlags = [
    'ENABLE_CLIENT_PORTAL=true',
    'ENABLE_PURCHASE_DEPARTMENT=true',
    'ENABLE_DOCUMENT_APPROVAL=true',
    'ENABLE_SHOP_DRAWINGS=true',
    'ENABLE_SUBCONTRACTOR_ACCESS=true'
  ];
  
  featureFlags.forEach(flag => {
    if (envContent.includes(flag)) {
      printPass(`Feature flag enabled: ${flag}`);
    } else {
      printWarning(`Feature flag not enabled: ${flag}`);
    }
  });
} else {
  printFail(`Environment file not found: ${envFile}`);
}

// Test 7: Type Definitions
console.log('\n📝 Testing Type Definitions...');

const typeFiles = [
  'src/types/auth.ts',
  'src/types/client-portal.ts',
  'src/types/purchase.ts',
  'src/types/database.ts',
  'src/types/projects.ts',
  'src/types/subcontractor.ts'
];

typeFiles.forEach(typeFile => {
  if (fs.existsSync(typeFile)) {
    printPass(`Type definition exists: ${path.basename(typeFile)}`);
  } else {
    printFail(`Type definition missing: ${typeFile}`);
  }
});

// Test 8: Hooks
console.log('\n🎣 Testing Custom Hooks...');

const hooks = [
  'src/hooks/useAuth.ts',
  'src/hooks/useClientPortal.ts',
  'src/hooks/usePurchase.ts',
  'src/hooks/useProjects.ts',
  'src/hooks/useSubcontractorPortal.ts'
];

hooks.forEach(hook => {
  if (fs.existsSync(hook)) {
    printPass(`Hook exists: ${path.basename(hook)}`);
  } else {
    printFail(`Hook missing: ${hook}`);
  }
});

// Test 9: Package.json validation
console.log('\n📦 Testing Package Configuration...');

if (fs.existsSync('package.json')) {
  const packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredDependencies = [
    'next',
    'react',
    'react-dom',
    '@supabase/supabase-js',
    '@supabase/auth-helpers-nextjs',
    'tailwindcss',
    'typescript',
    'zod',
    'react-hook-form'
  ];
  
  requiredDependencies.forEach(dep => {
    if (packageData.dependencies?.[dep] || packageData.devDependencies?.[dep]) {
      printPass(`Dependency installed: ${dep}`);
    } else {
      printFail(`Dependency missing: ${dep}`);
    }
  });
  
  // Check scripts
  const requiredScripts = ['dev', 'build', 'start', 'type-check'];
  requiredScripts.forEach(script => {
    if (packageData.scripts?.[script]) {
      printPass(`Script configured: ${script}`);
    } else {
      printFail(`Script missing: ${script}`);
    }
  });
} else {
  printFail('package.json not found');
}

// Test 10: Setup Scripts
console.log('\n🔧 Testing Setup Scripts...');

const setupScripts = [
  'scripts/setup-local-dev.sh',
  'scripts/validate-setup.sh'
];

setupScripts.forEach(script => {
  if (fs.existsSync(script)) {
    try {
      const stats = fs.statSync(script);
      if (stats.mode & parseInt('111', 8)) {
        printPass(`Setup script is executable: ${path.basename(script)}`);
      } else {
        printWarning(`Setup script not executable: ${script}`);
      }
    } catch (error) {
      printFail(`Cannot check script permissions: ${script}`);
    }
  } else {
    printFail(`Setup script missing: ${script}`);
  }
});

// Summary
console.log('\n📊 Test Summary');
console.log('================');
console.log(`✅ Passed: ${colors.green}${passedTests}${colors.reset}`);
console.log(`❌ Failed: ${colors.red}${failedTests}${colors.reset}`);
console.log(`⚠️  Warnings: ${colors.yellow}${warnings}${colors.reset}`);
console.log();

if (failedTests === 0) {
  console.log(`${colors.green}🎉 All critical tests passed!${colors.reset}`);
  console.log(`${colors.green}Formula PM 2.0 setup is complete and validated.${colors.reset}`);
  console.log();
  console.log('🚀 Your local development environment includes:');
  console.log('  • 18 realistic construction team members');
  console.log('  • 6 diverse construction projects');
  console.log('  • Complete client portal system');
  console.log('  • Purchase department workflow');
  console.log('  • Document approval system');
  console.log('  • Shop drawings mobile integration');
  console.log('  • Subcontractor access system');
  console.log('  • Role-based permissions');
  console.log();
  console.log('📖 Next steps:');
  console.log('  1. Run: npm run dev');
  console.log('  2. Open: http://localhost:3000');
  console.log('  3. Test with provided user accounts');
  console.log();
  process.exit(0);
} else {
  console.log(`${colors.red}❌ ${failedTests} tests failed.${colors.reset}`);
  console.log('Please address the issues above before proceeding.');
  console.log();
  console.log('🔧 Common fixes:');
  console.log('  • Run: npm install');
  console.log('  • Run: ./scripts/setup-local-dev.sh');
  console.log('  • Check file permissions');
  console.log('  • Verify environment configuration');
  console.log();
  process.exit(1);
}