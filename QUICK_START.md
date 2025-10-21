# Quick Start: Memory Leak Fix

## The Problem
CPU and memory usage increases with every API call and doesn't decrease when idle.

## The Solution
Three changes to prevent memory leaks:

1. **Connection pooling limits** - Prevents unlimited connection accumulation
2. **Document caching** - Reduces repeated network fetches
3. **Explicit cleanup** - New `destroy()` method to release resources

## Quick Fix for Your Code

### Option 1: One-time usage (scripts)
```typescript
const rettiwt = new Rettiwt({ apiKey: API_KEY });
try {
    await rettiwt.tweet.search({ fromUsers: ['user1'] }, 5);
} finally {
    rettiwt.destroy(); // Always call this!
}
```

### Option 2: Long-running server (recommended for your droplet)
```typescript
// Create ONCE at startup
const rettiwt = new Rettiwt({ apiKey: API_KEY });

// Reuse for all requests
app.get('/search', async (req, res) => {
    const tweets = await rettiwt.tweet.search({ fromUsers: [req.query.user] });
    res.json(tweets);
});

// Cleanup on shutdown
process.on('SIGTERM', () => rettiwt.destroy());
```

## What Changed in the Code

| File | Change |
|------|--------|
| `RettiwtConfig.ts` | Added connection limits & `destroy()` method |
| `FetcherService.ts` | Added document caching (5 min cache) |
| `Rettiwt.ts` | Added public `destroy()` method |

## Expected Behavior

**Before:**
- Memory: keeps growing 📈
- Connections: accumulate endlessly
- Result: eventual crash 💥

**After:**
- Memory: stable 📊
- Connections: max 10 idle, cleanup after 30s
- Result: runs forever ✅

## Testing

Monitor your droplet:
```bash
# Memory usage
watch -n 1 'ps aux | grep node'

# Connections to x.com
watch -n 1 'netstat -an | grep ESTABLISHED | grep x.com | wc -l'
```

You should see:
- Memory stays constant after requests finish
- Connections drop to ≤10 after 30 seconds
- CPU returns to idle levels

## Documentation

- `MEMORY_LEAK_FIX.md` - Full explanation
- `MEMORY_LEAK_FIX_SUMMARY.md` - Detailed summary
- `EXAMPLE_CORRECT_USAGE.ts` - Code examples

## TL;DR

**Just remember:** Always call `destroy()` when you're done with a Rettiwt instance!
