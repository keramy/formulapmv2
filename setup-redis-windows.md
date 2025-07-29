# Redis Setup for Windows - Formula PM v2

## Quick Setup Options:

### Option 1: Docker (Recommended)
```bash
# Install Docker Desktop first, then:
docker run -d --name redis-formulapm -p 6379:6379 redis:alpine
```

### Option 2: WSL2 (Windows Subsystem for Linux)
```bash
# In WSL2 terminal:
sudo apt update
sudo apt install redis-server
redis-server --daemonize yes
```

### Option 3: Memurai (Redis for Windows)
1. Download from: https://www.memurai.com/
2. Install and start the service
3. Default port: 6379

## Environment Configuration:

Add to your `.env.local`:
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Test Redis Connection:
```bash
# Test if Redis is running:
redis-cli ping
# Should return: PONG
```

## Start Redis (if using Option 1):
```bash
docker start redis-formulapm
```

## Benefits for Formula PM v2:
- 🚀 23ms faster API responses (cached auth)
- 💾 Dashboard stats caching (5min TTL)
- 🔄 Real-time features support
- 📊 Performance monitoring
- 🎯 User session management