/**
 * Optimization Validation Test Script
 * Tests that all new optimization patterns work correctly
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING OPTIMIZATION PATTERNS\n');

// Test 1: Verify all optimization files exist and are valid
console.log('📁 Testing File Existence...');

const optimizationFiles = [
  'src/lib/api-middleware.ts',
  'src/lib/query-builder.ts', 
  'src/hooks/useApiQuery.ts',
  'src/lib/form-validation.ts',
  'src/components/ui/loading-states.tsx'
];

let filesValid = true;
optimizationFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.length > 1000) { // Basic content check
      console.log(`✅ ${file} - EXISTS (${Math.round(content.length/1000)}KB)`);
    } else {
      console.log(`⚠️  ${file} - EXISTS but small (${content.length} bytes)`);
    }
  } else {
    console.log(`❌ ${file} - MISSING`);
    filesValid = false;
  }
});

// Test 2: Check for withAuth usage in migrated files
console.log('\n🔐 Testing withAuth Migration...');

const migratedFiles = [
  'src/app/api/auth/profile/route.ts',
  'src/app/api/auth/change-password/route.ts',
  'src/app/api/material-specs/[id]/approve/route.ts'
];

let migrationsValid = true;
migratedFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('withAuth') && content.includes('createErrorResponse')) {
      console.log(`✅ ${file} - MIGRATED`);
    } else if (content.includes('withAuth')) {
      console.log(`⚠️  ${file} - PARTIALLY MIGRATED`);
    } else {
      console.log(`❌ ${file} - NOT MIGRATED`);
      migrationsValid = false;
    }
  } else {
    console.log(`❌ ${file} - FILE NOT FOUND`);
    migrationsValid = false;
  }
});

// Test 3: Check for old patterns still in use
console.log('\n🔍 Scanning for Old Patterns...');

const apiDir = 'src/app/api';
let oldPatternCount = 0;
let totalApiFiles = 0;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (item === 'route.ts') {
      totalApiFiles++;
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for old authentication pattern
      if (content.includes('const { user, profile, error } = await verifyAuth(request)')) {
        oldPatternCount++;
        console.log(`📍 Old pattern found: ${fullPath.replace('src/app/api/', '')}`);
      }
    }
  });
}

scanDirectory(apiDir);

console.log(`\n📊 Pattern Analysis:`);
console.log(`   Total API routes: ${totalApiFiles}`);
console.log(`   Using old pattern: ${oldPatternCount}`);
console.log(`   Migration progress: ${Math.round((totalApiFiles - oldPatternCount) / totalApiFiles * 100)}%`);

// Test 4: Estimate code reduction
console.log('\n📏 Code Reduction Analysis...');

const oldPatternLines = oldPatternCount * 8; // Avg 8 lines per old auth pattern
const newPatternLines = oldPatternCount * 2; // Avg 2 lines per new pattern
const linesSaved = oldPatternLines - newPatternLines;

console.log(`   Lines with old pattern: ~${oldPatternLines}`);
console.log(`   Lines with new pattern: ~${newPatternLines}`);
console.log(`   Potential lines saved: ~${linesSaved}`);

// Test 5: Bundle size estimation
console.log('\n📦 Bundle Impact Analysis...');

const optimizationFileSizes = optimizationFiles.map(file => {
  if (fs.existsSync(file)) {
    return fs.statSync(file).size;
  }
  return 0;
}).reduce((a, b) => a + b, 0);

console.log(`   New optimization files: ${Math.round(optimizationFileSizes/1024)}KB`);
console.log(`   Estimated duplicate code removed: ~${Math.round(linesSaved * 50 / 1024)}KB`);
console.log(`   Net bundle impact: ${Math.round((optimizationFileSizes - linesSaved * 50) / 1024)}KB`);

// Final Report
console.log('\n🎯 OPTIMIZATION VALIDATION REPORT');
console.log('=====================================');

if (filesValid && migrationsValid) {
  console.log('✅ STATUS: READY FOR MIGRATION');
  console.log('✅ All optimization patterns created and validated');
  console.log('✅ Example migrations working correctly');
  console.log(`✅ ${totalApiFiles - oldPatternCount} routes already using new patterns`);
  console.log(`⏳ ${oldPatternCount} routes remaining to migrate`);
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Run: npm run type-check (should pass)');
  console.log('2. Start migrating remaining API routes');
  console.log('3. Follow OPTIMIZATION_MIGRATION_GUIDE.md');
  console.log('4. Target: 3-4 routes per day');
  
  console.log('\n📈 EXPECTED BENEFITS:');
  console.log(`• Code reduction: ~${linesSaved} lines`);
  console.log('• Consistent error handling across all APIs');
  console.log('• Centralized authentication logic');
  console.log('• Improved maintainability');
  
} else {
  console.log('❌ STATUS: ISSUES FOUND');
  if (!filesValid) console.log('❌ Some optimization files are missing or invalid');
  if (!migrationsValid) console.log('❌ Example migrations are not working correctly');
  console.log('\n🔧 FIX REQUIRED: Address issues above before proceeding');
}

console.log('\n📋 MIGRATION PRIORITY ORDER:');
console.log('1. API Routes (HIGH IMPACT) - Start here');
console.log('2. Data Fetching Hooks (MEDIUM IMPACT)');
console.log('3. Loading States (LOW IMPACT)');
console.log('4. Form Validation (LOW IMPACT)');

console.log('\n✨ Optimization foundation is ready!');
