#!/usr/bin/env node

/**
 * Debug script to check if projects are actually being soft deleted
 * This will help us understand if the issue is in the API or frontend
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration - using actual project values
const SUPABASE_URL = 'https://xrrrtwrfadcilwkgwacs.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycnJ0d3JmYWRjaWx3a2d3YWNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjA2NDM1MSwiZXhwIjoyMDY3NjQwMzUxfQ.FHwH6p5CzouCCmNbihgBSEXyq9jW2C_INnj22TDZsVc';

console.log('🔍 Debug: Checking project deletion status in database...\n');

async function checkProjectsInDatabase() {
  try {
    // Create service client to bypass RLS
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('1. Fetching ALL projects (including deleted ones)...');
    
    // Get all projects regardless of is_active status
    const { data: allProjects, error: allError } = await supabase
      .from('projects')
      .select('id, name, is_active, updated_at')
      .order('updated_at', { ascending: false });

    if (allError) {
      console.error('❌ Error fetching all projects:', allError);
      return;
    }

    console.log(`📊 Total projects in database: ${allProjects.length}\n`);

    // Group by is_active status
    const activeProjects = allProjects.filter(p => p.is_active);
    const deletedProjects = allProjects.filter(p => !p.is_active);

    console.log('📋 ACTIVE PROJECTS:');
    activeProjects.forEach(project => {
      console.log(`  ✅ ${project.name} (${project.id}) - Updated: ${project.updated_at}`);
    });

    console.log('\n🗑️ DELETED PROJECTS:');
    deletedProjects.forEach(project => {
      console.log(`  ❌ ${project.name} (${project.id}) - Updated: ${project.updated_at}`);
    });

    console.log('\n📊 SUMMARY:');
    console.log(`  Active projects: ${activeProjects.length}`);
    console.log(`  Deleted projects: ${deletedProjects.length}`);
    console.log(`  Total projects: ${allProjects.length}`);

    // Check for recently updated projects (likely deletion candidates)
    const recentlyUpdated = allProjects.filter(p => {
      const updateTime = new Date(p.updated_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return updateTime > fiveMinutesAgo;
    });

    if (recentlyUpdated.length > 0) {
      console.log('\n⏰ RECENTLY UPDATED PROJECTS (last 5 minutes):');
      recentlyUpdated.forEach(project => {
        console.log(`  🔄 ${project.name} - Active: ${project.is_active} - Updated: ${project.updated_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  }
}

async function testApiEndpoint() {
  console.log('\n🧪 Testing API endpoint response...\n');
  
  try {
    // Test the projects API endpoint to see what it returns
    const response = await fetch('http://localhost:3003/api/projects', {
      headers: {
        'Authorization': 'Bearer invalid-token' // This will fail but show us the response format
      }
    });
    
    console.log(`📡 API Response Status: ${response.status}`);
    const responseText = await response.text();
    console.log(`📡 API Response: ${responseText}`);
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run the debug checks
async function runDebug() {
  console.log('🚀 Starting database debug check...\n');
  
  await checkProjectsInDatabase();
  await testApiEndpoint();
  
  console.log('\n✅ Debug check completed!');
  console.log('\n💡 TROUBLESHOOTING TIPS:');
  console.log('1. If deleted projects show is_active=false but still appear in frontend:');
  console.log('   - Check if frontend is properly filtering by is_active=true');
  console.log('   - Check if there\'s a caching issue in the useProjects hook');
  console.log('2. If no projects show is_active=false:');
  console.log('   - The DELETE API is not actually updating the database');
  console.log('   - Check RLS policies and permissions');
}

runDebug().catch(console.error);