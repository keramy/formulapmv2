// Run this in your browser console to clear all authentication data
console.log('🧹 Clearing all authentication data...');

// Clear localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('supabase') || key.includes('auth'))) {
    keysToRemove.push(key);
  }
}
keysToRemove.forEach(key => {
  console.log(`  Removing localStorage: ${key}`);
  localStorage.removeItem(key);
});

// Clear sessionStorage
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (key.includes('supabase') || key.includes('auth'))) {
    sessionKeysToRemove.push(key);
  }
}
sessionKeysToRemove.forEach(key => {
  console.log(`  Removing sessionStorage: ${key}`);
  sessionStorage.removeItem(key);
});

// Clear cookies
document.cookie.split(";").forEach(function(c) { 
  const cookie = c.trim();
  if (cookie.includes('supabase') || cookie.includes('auth')) {
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    console.log(`  Removing cookie: ${name}`);
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
  }
});

console.log('✅ All authentication data cleared!');
console.log('🔄 Please refresh the page and try logging in again.');