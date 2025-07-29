#!/usr/bin/env node

/**
 * Auth Cleanup Script for Development
 * Run this after `supabase db reset` or `supabase db push` to prevent token conflicts
 * 
 * Usage:
 *   node scripts/cleanup-auth-after-db-reset.js
 *   npm run cleanup-auth
 */

const fs = require('fs')
const path = require('path')

console.log('🧹 Cleaning up authentication data after database reset...')

// This script can't access browser localStorage directly, 
// but it can provide instructions and create utility functions

const cleanupInstructions = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                      AUTH CLEANUP AFTER DB RESET                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  After running 'supabase db reset' or 'supabase db push', follow these:     ║
║                                                                              ║
║  1. Open your browser developer console (F12)                               ║
║  2. Run one of these commands:                                               ║
║                                                                              ║
║     Option A (Quick): localStorage.clear(); location.reload();              ║
║                                                                              ║
║     Option B (Precise): __DEV_RESET_AUTH()                                  ║
║                                                                              ║
║     Option C (Manual):                                                      ║
║       Object.keys(localStorage).forEach(k => {                              ║
║         if (k.startsWith('sb-')) localStorage.removeItem(k)                 ║
║       }); location.reload();                                                ║
║                                                                              ║
║  3. This will clear stale refresh tokens and prevent auth errors            ║
║                                                                              ║
║  Note: You may need to sign in again after cleanup                          ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`

console.log(cleanupInstructions)

// Create a simple HTML file that can auto-clear storage when opened
const autoCleanupHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Auth Cleanup - Formula PM</title>
    <style>
        body { 
            font-family: monospace; 
            padding: 20px; 
            background: #1a1a1a; 
            color: #00ff00; 
        }
        .success { color: #00ff00; }
        .warning { color: #ffaa00; }
        button { 
            background: #333; 
            color: white; 
            border: 1px solid #555; 
            padding: 10px 20px; 
            cursor: pointer; 
            margin: 5px;
        }
        button:hover { background: #555; }
        #output { 
            background: #000; 
            padding: 15px; 
            margin: 20px 0; 
            border: 1px solid #333;
            min-height: 200px;
        }
    </style>
</head>
<body>
    <h1>🧹 Formula PM - Auth Cleanup Tool</h1>
    <p class="warning">Use this after running 'supabase db reset' or 'supabase db push'</p>
    
    <button onclick="clearAllAuth()">Clear All Auth Data</button>
    <button onclick="clearTokensOnly()">Clear Tokens Only</button>
    <button onclick="showStorageInfo()">Show Storage Info</button>
    <button onclick="reloadApp()">Reload App</button>
    
    <div id="output"></div>
    
    <script>
        function log(message, type = 'info') {
            const output = document.getElementById('output');
            const timestamp = new Date().toLocaleTimeString();
            const className = type === 'error' ? 'error' : type === 'success' ? 'success' : 'warning';
            output.innerHTML += \`<div class="\${className}">[\${timestamp}] \${message}</div>\`;
            output.scrollTop = output.scrollHeight;
        }
        
        function clearAllAuth() {
            log('🧹 Starting complete auth cleanup...');
            let cleared = 0;
            
            // Clear localStorage
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.startsWith('supabase') || key.includes('auth') || key.includes('token')) {
                    localStorage.removeItem(key);
                    log(\`Cleared localStorage: \${key}\`, 'success');
                    cleared++;
                }
            });
            
            // Clear sessionStorage
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith('sb-') || key.startsWith('supabase') || key.includes('auth') || key.includes('token')) {
                    sessionStorage.removeItem(key);
                    log(\`Cleared sessionStorage: \${key}\`, 'success');
                    cleared++;
                }
            });
            
            log(\`✅ Cleanup complete! Cleared \${cleared} items\`, 'success');
            log('You can now close this tab and refresh your app', 'warning');
        }
        
        function clearTokensOnly() {
            log('🔧 Clearing Supabase tokens only...');
            let cleared = 0;
            
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.startsWith('supabase')) {
                    localStorage.removeItem(key);
                    log(\`Cleared: \${key}\`, 'success');
                    cleared++;
                }
            });
            
            log(\`✅ Cleared \${cleared} token items\`, 'success');
        }
        
        function showStorageInfo() {
            log('📊 Current storage contents:');
            
            const authKeys = [];
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('sb-') || key.startsWith('supabase') || key.includes('auth') || key.includes('token')) {
                    authKeys.push(key);
                }
            });
            
            if (authKeys.length === 0) {
                log('✅ No auth-related items found in storage', 'success');
            } else {
                log(\`⚠️ Found \${authKeys.length} auth-related items:\`, 'warning');
                authKeys.forEach(key => {
                    const value = localStorage.getItem(key);
                    const preview = value ? (value.length > 50 ? value.substring(0, 50) + '...' : value) : 'null';
                    log(\`  - \${key}: \${preview}\`);
                });
            }
        }
        
        function reloadApp() {
            log('🔄 Reloading application...', 'warning');
            setTimeout(() => {
                window.location.href = 'http://localhost:3003';
            }, 1000);
        }
        
        // Auto-show storage info on load
        showStorageInfo();
    </script>
</body>
</html>
`

// Write the cleanup HTML file
const cleanupFilePath = path.join(__dirname, '..', 'auth-cleanup.html')

try {
  fs.writeFileSync(cleanupFilePath, autoCleanupHtml)
  console.log(`✅ Created auth cleanup tool: ${cleanupFilePath}`)
  console.log(`   Open this file in your browser for an interactive cleanup tool`)
} catch (error) {
  console.error('❌ Error creating cleanup file:', error.message)
}

console.log('\n🎯 Quick Commands for Browser Console:')
console.log('   localStorage.clear(); location.reload();')
console.log('   __DEV_RESET_AUTH()  // If available')

console.log('\n✅ Cleanup script completed!')
console.log('   Remember to refresh your browser after running cleanup commands')