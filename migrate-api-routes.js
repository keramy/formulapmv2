/**
 * Automated API Route Migration Script
 * Migrates remaining routes to use withAuth pattern
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting API Route Migration...\n');

// Routes that need migration (from our test results)
const routesToMigrate = [
  'src/app/api/material-specs/bulk/route.ts',
  'src/app/api/material-specs/statistics/route.ts',
  'src/app/api/material-specs/[id]/link-scope/route.ts',
  'src/app/api/material-specs/[id]/reject/route.ts',
  'src/app/api/material-specs/[id]/request-revision/route.ts',
  'src/app/api/material-specs/[id]/unlink-scope/route.ts',
  'src/app/api/milestones/bulk/route.ts',
  'src/app/api/milestones/statistics/route.ts',
  'src/app/api/milestones/[id]/route.ts',
  'src/app/api/milestones/[id]/status/route.ts',
  'src/app/api/projects/metrics/route.ts',
  'src/app/api/projects/[id]/material-specs/route.ts',
  'src/app/api/projects/[id]/milestones/route.ts',
  'src/app/api/projects/[id]/tasks/route.ts',
  'src/app/api/scope/bulk/route.ts',
  'src/app/api/scope/excel/export/route.ts',
  'src/app/api/scope/excel/import/route.ts',
  'src/app/api/scope/overview/route.ts',
  'src/app/api/scope/[id]/dependencies/route.ts',
  'src/app/api/scope/[id]/route.ts',
  'src/app/api/tasks/statistics/route.ts',
  'src/app/api/tasks/[id]/comments/route.ts',
  'src/app/api/tasks/[id]/route.ts',
  'src/app/api/test-auth/route.ts'
];

let migratedCount = 0;
let errorCount = 0;

function migrateRoute(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already migrated
    if (content.includes('withAuth') && content.includes('createErrorResponse')) {
      console.log(`✅ Already migrated: ${filePath}`);
      return true;
    }

    // Check if it has the old pattern
    if (!content.includes('const { user, profile, error } = await verifyAuth(request)')) {
      console.log(`⚠️  No old pattern found: ${filePath}`);
      return false;
    }

    console.log(`🔄 Migrating: ${filePath}`);

    // Step 1: Update imports
    content = content.replace(
      /import { verifyAuth } from '@\/lib\/middleware'/g,
      "import { withAuth, createSuccessResponse, createErrorResponse } from '@/lib/api-middleware'"
    );

    // Step 2: Replace function signatures
    content = content.replace(
      /export async function (GET|POST|PUT|DELETE|PATCH)\(([^)]+)\) \{/g,
      'export const $1 = withAuth(async ($2, { user, profile }) => {'
    );

    // Step 3: Remove manual auth checks
    content = content.replace(
      /\s*\/\/ Authentication check[\s\S]*?if \(error \|\| !user \|\| !profile\) \{[\s\S]*?\}\s*/g,
      '\n'
    );

    // Step 4: Replace error responses
    content = content.replace(
      /return NextResponse\.json\(\s*\{\s*success:\s*false,\s*error:\s*([^}]+)\s*\},\s*\{\s*status:\s*(\d+)\s*\}\s*\)/g,
      'return createErrorResponse($1, $2)'
    );

    content = content.replace(
      /return NextResponse\.json\(\s*\{\s*error:\s*([^}]+)\s*\},\s*\{\s*status:\s*(\d+)\s*\}\s*\)/g,
      'return createErrorResponse($1, $2)'
    );

    // Step 5: Replace success responses
    content = content.replace(
      /return NextResponse\.json\(\s*\{\s*success:\s*true,\s*data:\s*([^}]+)\s*\}\s*\)/g,
      'return createSuccessResponse($1)'
    );

    content = content.replace(
      /return NextResponse\.json\(\s*\{\s*success:\s*true,\s*([^}]+)\s*\}\s*\)/g,
      'return createSuccessResponse({ $1 })'
    );

    // Step 6: Add closing bracket for withAuth
    // Find the last closing brace and replace it
    const lines = content.split('\n');
    let lastBraceIndex = -1;
    let braceCount = 0;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '}') {
        lastBraceIndex = i;
        break;
      }
    }
    
    if (lastBraceIndex !== -1) {
      lines[lastBraceIndex] = '})';
      content = lines.join('\n');
    }

    // Write the migrated content
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Migrated: ${filePath}`);
    return true;

  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

// Migrate all routes
console.log(`📋 Found ${routesToMigrate.length} routes to migrate\n`);

routesToMigrate.forEach(route => {
  if (migrateRoute(route)) {
    migratedCount++;
  } else {
    errorCount++;
  }
});

console.log('\n📊 Migration Summary:');
console.log(`✅ Successfully migrated: ${migratedCount}`);
console.log(`❌ Errors or skipped: ${errorCount}`);
console.log(`📈 Total routes processed: ${routesToMigrate.length}`);

if (migratedCount > 0) {
  console.log('\n🔍 Next steps:');
  console.log('1. Run: npm run type-check');
  console.log('2. Test migrated endpoints');
  console.log('3. Run: node test-optimizations.js');
}

console.log('\n✨ API route migration complete!');
