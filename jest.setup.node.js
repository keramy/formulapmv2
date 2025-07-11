/**
 * Jest Node.js Testing Setup
 * Configuration for API route testing in Node environment
 */

// Use real Supabase environment variables for testing
// These should be set from the actual .env.local file
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
}

// Mock crypto for UUID generation
const crypto = require('crypto');
global.crypto = {
  ...crypto,
  randomUUID: jest.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
};

// Mock Headers constructor
global.Headers = class Headers {
  constructor(init) {
    this.map = new Map();
    if (init) {
      if (init instanceof Headers) {
        init.forEach((value, key) => this.set(key, value));
      } else if (Array.isArray(init)) {
        init.forEach(([key, value]) => this.set(key, value));
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this.set(key, value));
      }
    }
  }

  append(name, value) {
    const existing = this.map.get(name.toLowerCase());
    this.map.set(name.toLowerCase(), existing ? `${existing}, ${value}` : value);
  }

  delete(name) {
    this.map.delete(name.toLowerCase());
  }

  get(name) {
    return this.map.get(name.toLowerCase()) || null;
  }

  has(name) {
    return this.map.has(name.toLowerCase());
  }

  set(name, value) {
    this.map.set(name.toLowerCase(), value);
  }

  forEach(callback) {
    this.map.forEach((value, key) => callback(value, key, this));
  }

  keys() {
    return this.map.keys();
  }

  values() {
    return this.map.values();
  }

  entries() {
    return this.map.entries();
  }

  [Symbol.iterator]() {
    return this.map.entries();
  }
};

// Mock URL global
const { URL: NodeURL } = require('url');
global.URL = class URL {
  constructor(url, base) {
    const resolved = base ? new NodeURL(url, base) : new NodeURL(url);
    this.href = resolved.href;
    this.origin = resolved.origin;
    this.protocol = resolved.protocol;
    this.username = resolved.username;
    this.password = resolved.password;
    this.host = resolved.host;
    this.hostname = resolved.hostname;
    this.port = resolved.port;
    this.pathname = resolved.pathname;
    this.search = resolved.search;
    this.searchParams = new URLSearchParams(resolved.search);
    this.hash = resolved.hash;
  }

  toString() {
    return this.href;
  }

  static createObjectURL() {
    return 'mock-object-url';
  }
};

// Mock URLSearchParams
global.URLSearchParams = class URLSearchParams {
  constructor(init) {
    this.params = new Map();
    if (typeof init === 'string') {
      init.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
      });
    } else if (init instanceof URLSearchParams) {
      init.forEach((value, key) => this.params.set(key, value));
    } else if (Array.isArray(init)) {
      init.forEach(([key, value]) => this.params.set(key, value));
    } else if (init && typeof init === 'object') {
      Object.entries(init).forEach(([key, value]) => this.params.set(key, value));
    }
  }

  append(name, value) {
    const existing = this.params.get(name);
    this.params.set(name, existing ? `${existing},${value}` : value);
  }

  delete(name) {
    this.params.delete(name);
  }

  get(name) {
    return this.params.get(name) || null;
  }

  getAll(name) {
    const value = this.params.get(name);
    return value ? value.split(',') : [];
  }

  has(name) {
    return this.params.has(name);
  }

  set(name, value) {
    this.params.set(name, value);
  }

  sort() {
    const sorted = new Map([...this.params.entries()].sort());
    this.params = sorted;
  }

  toString() {
    const pairs = [];
    this.params.forEach((value, key) => {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });
    return pairs.join('&');
  }

  forEach(callback) {
    this.params.forEach((value, key) => callback(value, key, this));
  }

  keys() {
    return this.params.keys();
  }

  values() {
    return this.params.values();
  }

  entries() {
    return this.params.entries();
  }

  [Symbol.iterator]() {
    return this.params.entries();
  }
};

// Mock RequestCookies that NextRequest depends on
const MockRequestCookies = class RequestCookies {
  constructor() {
    this.cookies = new Map();
  }

  get(name) {
    const cookie = this.cookies.get(name);
    return cookie ? { name, value: cookie.value, ...cookie } : undefined;
  }

  getAll() {
    return Array.from(this.cookies.entries()).map(([name, cookie]) => ({
      name,
      value: cookie.value,
      ...cookie
    }));
  }

  has(name) {
    return this.cookies.has(name);
  }

  set(name, value, options = {}) {
    this.cookies.set(name, { value, ...options });
    return this;
  }

  delete(name) {
    this.cookies.delete(name);
    return this;
  }

  clear() {
    this.cookies.clear();
    return this;
  }

  toString() {
    return Array.from(this.cookies.entries())
      .map(([name, cookie]) => `${name}=${cookie.value}`)
      .join('; ');
  }

  [Symbol.iterator]() {
    return this.getAll()[Symbol.iterator]();
  }
};

// Mock the cookies module that NextRequest uses
jest.mock('next/dist/compiled/@edge-runtime/cookies', () => ({
  RequestCookies: MockRequestCookies,
  ResponseCookies: MockRequestCookies,
}));

// Mock NextRequest properly
const { URL } = require('url');

global.NextRequest = class NextRequest {
  constructor(input, init = {}) {
    const url = typeof input === 'string' ? input : input.url;
    const parsedUrl = new URL(url);
    
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new global.Headers(init.headers);
    this.body = init.body || null;
    this.bodyUsed = false;
    this.redirect = init.redirect || 'follow';
    this.referrer = init.referrer || '';
    this.referrerPolicy = init.referrerPolicy || '';
    this.mode = init.mode || 'cors';
    this.credentials = init.credentials || 'same-origin';
    this.cache = init.cache || 'default';
    this.integrity = init.integrity || '';
    this.keepalive = init.keepalive || false;
    this.signal = init.signal || null;

    // NextRequest specific properties
    this.nextUrl = {
      href: parsedUrl.href,
      origin: parsedUrl.origin,
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      pathname: parsedUrl.pathname,
      search: parsedUrl.search,
      searchParams: new global.URLSearchParams(parsedUrl.search),
      hash: parsedUrl.hash,
      clone: () => ({ ...this.nextUrl }),
      toString: () => parsedUrl.href,
    };

    // Mock cookies without using the problematic RequestCookies
    this.cookies = new MockRequestCookies();
    
    // Mock geo and ip
    this.geo = {};
    this.ip = '127.0.0.1';
  }

  async json() {
    if (this.bodyUsed) {
      throw new TypeError('Body has already been consumed');
    }
    this.bodyUsed = true;
    try {
      return this.body ? JSON.parse(this.body) : {};
    } catch (e) {
      throw new TypeError('Invalid JSON');
    }
  }

  async text() {
    if (this.bodyUsed) {
      throw new TypeError('Body has already been consumed');
    }
    this.bodyUsed = true;
    return this.body || '';
  }

  async formData() {
    if (this.bodyUsed) {
      throw new TypeError('Body has already been consumed');
    }
    this.bodyUsed = true;
    const formData = new FormData();
    if (this.body) {
      // Simple parsing for test purposes
      this.body.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key) formData.append(decodeURIComponent(key), decodeURIComponent(value || ''));
      });
    }
    return formData;
  }

  async arrayBuffer() {
    if (this.bodyUsed) {
      throw new TypeError('Body has already been consumed');
    }
    this.bodyUsed = true;
    return new ArrayBuffer(0);
  }

  clone() {
    if (this.bodyUsed) {
      throw new TypeError('Body has already been consumed');
    }
    return new NextRequest(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body,
    });
  }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};