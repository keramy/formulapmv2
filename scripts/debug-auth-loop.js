/**
 * Authentication Loop Debug Script
 * 
 * This script helps identify infinite 401 authentication loops by:
 * 1. Monitoring console logs for auth patterns
 * 2. Detecting repeated request patterns
 * 3. Analyzing token refresh cycles
 * 4. Tracking state transitions
 * 
 * Usage:
 * 1. Open browser console
 * 2. Paste this script
 * 3. Run it while reproducing the auth loop
 * 4. Check the analysis results
 */

// Auth Loop Debug Monitor
window.AuthLoopDebugger = {
  logs: [],
  patterns: {},
  startTime: Date.now(),
  
  // Initialize the debugger
  init() {
    console.log('🔍 Auth Loop Debugger initialized');
    this.interceptConsoleLogs();
    this.setupPeriodicAnalysis();
    return this;
  },
  
  // Intercept console logs to analyze patterns
  interceptConsoleLogs() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = (...args) => {
      this.captureLog('log', args);
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      this.captureLog('error', args);
      originalError.apply(console, args);
    };
    
    console.warn = (...args) => {
      this.captureLog('warn', args);
      originalWarn.apply(console, args);
    };
  },
  
  // Capture and analyze log entries
  captureLog(type, args) {
    const timestamp = Date.now();
    const logEntry = {
      type,
      timestamp,
      message: args[0] || '',
      data: args[1] || null,
      relativeTime: timestamp - this.startTime
    };
    
    this.logs.push(logEntry);
    
    // Analyze for auth patterns
    this.analyzeLogEntry(logEntry);
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
  },
  
  // Analyze individual log entries for patterns
  analyzeLogEntry(entry) {
    const message = entry.message;
    
    // Track getAccessToken calls
    if (message.includes('getAccessToken - REQUEST START')) {
      const requestId = this.extractRequestId(message);
      if (requestId) {
        this.trackPattern('getAccessToken_requests', requestId, entry.timestamp);
      }
    }
    
    // Track API calls
    if (message.includes('Making API call')) {
      this.trackPattern('api_calls', 'api_call', entry.timestamp);
    }
    
    // Track 401 errors
    if (message.includes('401') || message.includes('Token verification failed')) {
      this.trackPattern('auth_errors', '401_error', entry.timestamp);
    }
    
    // Track auth state changes
    if (message.includes('Auth state change detected')) {
      const eventType = entry.data?.event || 'unknown';
      this.trackPattern('auth_state_changes', eventType, entry.timestamp);
    }
    
    // Track profile fetch attempts
    if (message.includes('fetchUserProfile - START')) {
      const fetchId = this.extractRequestId(message);
      if (fetchId) {
        this.trackPattern('profile_fetches', fetchId, entry.timestamp);
      }
    }
  },
  
  // Extract request ID from log message
  extractRequestId(message) {
    const match = message.match(/\[([a-z0-9]+)\]/);
    return match ? match[1] : null;
  },
  
  // Track patterns with timing
  trackPattern(category, identifier, timestamp) {
    if (!this.patterns[category]) {
      this.patterns[category] = {};
    }
    
    if (!this.patterns[category][identifier]) {
      this.patterns[category][identifier] = [];
    }
    
    this.patterns[category][identifier].push(timestamp);
  },
  
  // Setup periodic analysis
  setupPeriodicAnalysis() {
    setInterval(() => {
      this.detectLoopPatterns();
    }, 5000); // Check every 5 seconds
  },
  
  // Detect potential infinite loops
  detectLoopPatterns() {
    const now = Date.now();
    const last30Seconds = now - 30000;
    
    // Check for repeated getAccessToken calls
    const recentTokenRequests = this.countRecentEvents('getAccessToken_requests', last30Seconds);
    if (recentTokenRequests > 10) {
      console.warn(`⚠️ POTENTIAL LOOP: ${recentTokenRequests} token requests in last 30 seconds`);
    }
    
    // Check for repeated API calls
    const recentApiCalls = this.countRecentEvents('api_calls', last30Seconds);
    if (recentApiCalls > 20) {
      console.warn(`⚠️ POTENTIAL LOOP: ${recentApiCalls} API calls in last 30 seconds`);
    }
    
    // Check for repeated 401 errors
    const recent401s = this.countRecentEvents('auth_errors', last30Seconds);
    if (recent401s > 5) {
      console.error(`🚨 LOOP DETECTED: ${recent401s} auth errors in last 30 seconds`);
      this.generateReport();
    }
  },
  
  // Count recent events for a pattern
  countRecentEvents(category, since) {
    let count = 0;
    const patterns = this.patterns[category] || {};
    
    Object.values(patterns).forEach(timestamps => {
      count += timestamps.filter(ts => ts > since).length;
    });
    
    return count;
  },
  
  // Generate comprehensive analysis report
  generateReport() {
    console.group('🔍 AUTH LOOP ANALYSIS REPORT');
    
    const now = Date.now();
    const last60Seconds = now - 60000;
    
    console.log('📊 Summary (Last 60 seconds):');
    console.log(`• Token requests: ${this.countRecentEvents('getAccessToken_requests', last60Seconds)}`);
    console.log(`• API calls: ${this.countRecentEvents('api_calls', last60Seconds)}`);
    console.log(`• Auth errors: ${this.countRecentEvents('auth_errors', last60Seconds)}`);
    console.log(`• Profile fetches: ${this.countRecentEvents('profile_fetches', last60Seconds)}`);
    
    console.log('\\n🔄 Recent Auth State Changes:');
    const authChanges = this.patterns.auth_state_changes || {};
    Object.entries(authChanges).forEach(([event, timestamps]) => {
      const recentCount = timestamps.filter(ts => ts > last60Seconds).length;
      if (recentCount > 0) {
        console.log(`• ${event}: ${recentCount} times`);
      }
    });
    
    console.log('\\n📋 Recent Log Entries (Last 10):');
    this.logs.slice(-10).forEach(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      console.log(`[${time}] ${entry.type.toUpperCase()}: ${entry.message}`);
    });
    
    console.log('\\n🎯 Potential Root Causes:');
    this.diagnosePotentialCauses();
    
    console.groupEnd();
  },
  
  // Diagnose potential causes based on patterns
  diagnosePotentialCauses() {
    const tokenRequests = this.countRecentEvents('getAccessToken_requests', Date.now() - 30000);
    const authErrors = this.countRecentEvents('auth_errors', Date.now() - 30000);
    const profileFetches = this.countRecentEvents('profile_fetches', Date.now() - 30000);
    
    if (tokenRequests > 10 && authErrors > 5) {
      console.log('🔴 HIGH PROBABILITY: Token refresh failure loop');
      console.log('   → Check token refresh logic and network connectivity');
    }
    
    if (profileFetches > 10 && authErrors > 5) {
      console.log('🔴 HIGH PROBABILITY: Profile fetch failure loop');
      console.log('   → Check database connectivity and RLS policies');
    }
    
    if (tokenRequests > 15 && profileFetches < 3) {
      console.log('🟡 MEDIUM PROBABILITY: Token caching issue');
      console.log('   → Check token cache logic and expiry calculations');
    }
    
    if (authErrors > 10) {
      console.log('🔴 HIGH PROBABILITY: Authentication system failure');
      console.log('   → Check Supabase connection and JWT validation');
    }
  },
  
  // Manual analysis commands
  showRecentLogs(count = 20) {
    console.log(`📋 Last ${count} logs:`);
    this.logs.slice(-count).forEach(entry => {
      const time = new Date(entry.timestamp).toLocaleTimeString();
      console.log(`[${time}] ${entry.type.toUpperCase()}: ${entry.message}`);
    });
  },
  
  showPatterns() {
    console.log('📊 Current patterns:');
    Object.entries(this.patterns).forEach(([category, patterns]) => {
      console.log(`\\n${category}:`);
      Object.entries(patterns).forEach(([id, timestamps]) => {
        console.log(`  ${id}: ${timestamps.length} occurrences`);
      });
    });
  },
  
  clearData() {
    this.logs = [];
    this.patterns = {};
    this.startTime = Date.now();
    console.log('🧹 Debug data cleared');
  }
};

// Auto-initialize when script loads
window.AuthLoopDebugger.init();

console.log(`
🔍 Auth Loop Debugger Ready!

Commands:
• AuthLoopDebugger.generateReport() - Generate analysis report
• AuthLoopDebugger.showRecentLogs(20) - Show recent logs
• AuthLoopDebugger.showPatterns() - Show detected patterns
• AuthLoopDebugger.clearData() - Clear collected data

The debugger is now monitoring your authentication flow.
Reproduce the infinite 401 loop and check the console for alerts!
`);