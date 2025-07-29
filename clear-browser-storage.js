// Run this in browser console to clear all Supabase session data

// Clear localStorage
localStorage.removeItem('sb-127-auth-token')
localStorage.removeItem('sb-localhost-auth-token')
Object.keys(localStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('sb-')) {
    localStorage.removeItem(key)
  }
})

// Clear sessionStorage 
sessionStorage.removeItem('sb-127-auth-token')
sessionStorage.removeItem('sb-localhost-auth-token')
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('supabase') || key.includes('sb-')) {
    sessionStorage.removeItem(key)
  }
})

// Clear all cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log('✅ All Supabase session data cleared. Refresh the page.');