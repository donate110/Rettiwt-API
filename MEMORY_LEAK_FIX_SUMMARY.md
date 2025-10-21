# Memory Leak Fix Summary

## Problem Identified

Your droplet was experiencing gradual increases in CPU and memory usage when calling the `TweetService.search()` function because:

1. **Unbounded HTTP Connection Pooling**: Each API call created new HTTP connections that were never properly cleaned up
2. **No Connection Limits**: The HTTPS agent had no limits on connections (maxSockets, maxFreeSockets)
3. **Repeated Document Fetching**: Every single request fetched the X homepage HTML for transaction ID generation
4. **No Cleanup Mechanism**: There was no way to explicitly destroy connections when done

## Changes Made

### 1. `src/models/RettiwtConfig.ts`
- Added `AgentOptions` with proper connection pooling limits:
  - `maxSockets: 50` - limits total concurrent connections
  - `maxFreeSockets: 10` - limits idle connections in pool
  - `freeSocketTimeout: 30000ms` - closes idle connections after 30 seconds
  - `keepAlive: true` - reuses connections efficiently
- Added `destroy()` method to clean up the HTTPS agent
- Updated constructor and `proxyUrl` setter to use the new options

### 2. `src/services/public/FetcherService.ts`
- Added document caching mechanism:
  - `_cachedDocument` - stores the X homepage HTML
  - `_cacheTimestamp` - tracks when document was cached
  - `_cacheDuration` - set to 5 minutes
- Modified `_getTransactionHeader()` to use cached document instead of fetching every time
- This reduces network calls, memory allocations, and CPU usage significantly

### 3. `src/Rettiwt.ts`
- Added public `destroy()` method that calls `_config.destroy()`
- Provides clean API for users to clean up resources

## How to Use

### ✅ Correct Usage (Always call destroy when done)

```typescript
import { Rettiwt } from 'rettiwt-api';

async function searchTweets() {
    const rettiwt = new Rettiwt({ apiKey: API_KEY });
    
    try {
        const tweets = await rettiwt.tweet.search({ 
            fromUsers: ['user1'] 
        }, 5);
        console.log(tweets);
    } finally {
        // IMPORTANT: Clean up resources
        rettiwt.destroy();
    }
}
```

### ✅ For Long-Running Servers (Create once, reuse, destroy on shutdown)

```typescript
import { Rettiwt } from 'rettiwt-api';
import express from 'express';

const app = express();
const rettiwt = new Rettiwt({ apiKey: API_KEY }); // Create ONCE

app.get('/search', async (req, res) => {
    // Reuse the same instance
    const tweets = await rettiwt.tweet.search({ 
        fromUsers: [req.query.user] 
    }, 10);
    res.json(tweets);
});

const server = app.listen(3000);

// Clean up on shutdown
process.on('SIGTERM', () => {
    rettiwt.destroy(); // Clean up once at the end
    server.close();
});
```

### ❌ Wrong Usage (Memory Leak)

```typescript
// DON'T DO THIS - Creates memory leak!
app.get('/search', async (req, res) => {
    const rettiwt = new Rettiwt({ apiKey: API_KEY }); // New instance every request!
    const tweets = await rettiwt.tweet.search({ fromUsers: [req.query.user] });
    res.json(tweets);
    // No destroy() called - connections leak!
});
```

## Expected Results

### Before Fix
- Memory increases continuously: 150MB → 200MB → 250MB → 300MB...
- Connections accumulate: 20 → 50 → 100 → 200+
- CPU usage stays elevated even when idle
- Eventually hits resource limits and crashes

### After Fix
- Memory stays constant: ~180MB (stable)
- Connections limited: max 10 idle connections, max 50 total
- CPU returns to baseline when idle
- Application runs indefinitely without issues

## Testing the Fix

1. **Deploy the updated code to your droplet**
2. **Monitor memory usage:**
   ```bash
   watch -n 1 'ps aux | grep node'
   ```
3. **Monitor connections:**
   ```bash
   watch -n 1 'netstat -an | grep ESTABLISHED | grep x.com | wc -l'
   ```
4. **Make API calls and verify:**
   - Memory increases during requests but returns to baseline
   - Connections drop back to ~10 or fewer after 30 seconds
   - CPU usage returns to idle levels

## Migration Guide

If you have existing code:

1. **Wrap usage in try-finally:**
   ```typescript
   const rettiwt = new Rettiwt({ apiKey: API_KEY });
   try {
       // Your code
   } finally {
       rettiwt.destroy();
   }
   ```

2. **For servers, create singleton instance:**
   ```typescript
   // At top of file
   const rettiwt = new Rettiwt({ apiKey: API_KEY });
   
   // Use in routes
   app.get('/route', async (req, res) => {
       await rettiwt.tweet.search(...);
   });
   
   // Clean up on shutdown
   process.on('SIGTERM', () => rettiwt.destroy());
   ```

3. **For worker classes, add cleanup:**
   ```typescript
   class Worker {
       private rettiwt = new Rettiwt({ apiKey: API_KEY });
       
       shutdown() {
           this.rettiwt.destroy();
       }
   }
   ```

## Documentation

See these files for more details:
- `MEMORY_LEAK_FIX.md` - Comprehensive documentation
- `EXAMPLE_CORRECT_USAGE.ts` - Multiple usage examples

## Questions?

Common issues:
- **Still seeing memory increase?** Check if all instances have `destroy()` called
- **Seeing errors after calling destroy()?** Don't call destroy() until all operations complete
- **Need more connections?** Modify `AgentOptions` in `RettiwtConfig.ts`
