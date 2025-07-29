// Run this in browser console to clear all auth storage
// This will ensure complete logout without auto-login

function clearAllAuthStorage() {
  console.log('🧹 Clearing all authentication storage...');
  
  // Clear localStorage
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('sb-') || key.startsWith('supabase'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    console.log(`Removing localStorage key: ${key}`);
    localStorage.removeItem(key);
  });
  
  // Clear sessionStorage
  const sessionKeysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith('sb-') || key.startsWith('supabase'))) {
      sessionKeysToRemove.push(key);
    }
  }
  
  sessionKeysToRemove.forEach(key => {
    console.log(`Removing sessionStorage key: ${key}`);
    sessionStorage.removeItem(key);
  });
  
  // Clear cookies that might contain auth tokens
  document.cookie.split(";").forEach(function(c) { 
    if (c.includes('sb-') || c.includes('supabase')) {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    }
  });
  
  console.log('✅ All auth storage cleared!');
  console.log('🔄 Refreshing page...');
  
  // Refresh the page
  setTimeout(() => {
    window.location.href = '/auth/login';
  }, 1000);
}

// Execute the function
clearAllAuthStorage();