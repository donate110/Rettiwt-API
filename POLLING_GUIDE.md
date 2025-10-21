# Polling Every 15 Seconds - Complete Guide

This guide shows you exactly how to fetch tweets every 15 seconds without memory leaks.

## 🎯 The Key Rule

**Create ONE Rettiwt instance and reuse it for all polls. Call `destroy()` only when shutting down.**

## ✅ Quick Start

Here's the simplest working example:

```typescript
import { Rettiwt } from 'rettiwt-api';

const rettiwt = new Rettiwt({ apiKey: 'YOUR_API_KEY' });

const poll = async () => {
    try {
        const tweets = await rettiwt.tweet.search({ fromUsers: ['nasa'] }, 10);
        console.log(`Found ${tweets.list.length} tweets`);
    } catch (error) {
        console.error('Error:', error);
    }
};

// Poll immediately, then every 15 seconds
poll();
const intervalId = setInterval(poll, 15000);

// Cleanup on shutdown (Ctrl+C)
process.on('SIGINT', () => {
    clearInterval(intervalId);
    rettiwt.destroy();
    process.exit(0);
});
```

## 📁 Files to Use

I've created several example files for you:

### 1. **`examples/simple-polling.ts`** ⭐ RECOMMENDED
   - Ready-to-use script
   - Just set your API key and run
   - Clean console output with emojis
   - Proper error handling

### 2. **`EXAMPLE_POLLING.ts`**
   - Multiple advanced examples
   - Different polling strategies
   - Cursor management for new tweets only
   - Server integration examples

## 🚀 How to Run

### Option A: Using the Simple Example

1. **Set your API key:**
   ```bash
   export TWITTER_API_KEY='your_api_key_here'
   ```

2. **Run the script:**
   ```bash
   npx ts-node examples/simple-polling.ts
   ```

3. **Stop with Ctrl+C** (it will clean up properly)

### Option B: Customize and Run

1. **Edit `examples/simple-polling.ts`:**
   ```typescript
   const CONFIG = {
       apiKey: 'YOUR_ACTUAL_API_KEY',
       pollingInterval: 15000,  // 15 seconds
       tweetCount: 10,
       filter: {
           fromUsers: ['nasa', 'spacex'],  // Change to your target users
       },
   };
   ```

2. **Run it:**
   ```bash
   npx ts-node examples/simple-polling.ts
   ```

## 🏗️ Integrate into Your Server

### For Express.js:

```typescript
import { Rettiwt } from 'rettiwt-api';
import express from 'express';

const app = express();

// Create ONE instance for entire server
const rettiwt = new Rettiwt({ apiKey: process.env.TWITTER_API_KEY });

// Cache for storing latest tweets
let cachedTweets: any[] = [];
let lastUpdate: Date = new Date();

// Background polling function
const pollTwitter = async () => {
    try {
        const result = await rettiwt.tweet.search({ fromUsers: ['nasa'] }, 10);
        cachedTweets = result.list;
        lastUpdate = new Date();
        console.log(`[${lastUpdate.toISOString()}] Updated cache with ${cachedTweets.length} tweets`);
    } catch (error) {
        console.error('Polling error:', error);
    }
};

// Start background polling every 15 seconds
pollTwitter(); // Initial fetch
const pollInterval = setInterval(pollTwitter, 15000);

// API endpoint (instant response, no API call)
app.get('/api/tweets', (req, res) => {
    res.json({
        tweets: cachedTweets,
        lastUpdate,
        count: cachedTweets.length
    });
});

const server = app.listen(3000, () => {
    console.log('Server running on port 3000');
    console.log('Polling Twitter every 15 seconds in background');
});

// Graceful shutdown
const shutdown = () => {
    console.log('Shutting down...');
    clearInterval(pollInterval);
    rettiwt.destroy();
    server.close();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```

### For Next.js API Route:

Create a singleton instance in a separate file:

**`lib/twitter-poller.ts`:**
```typescript
import { Rettiwt } from 'rettiwt-api';

class TwitterPoller {
    private static instance: TwitterPoller;
    private rettiwt: Rettiwt;
    private cachedTweets: any[] = [];
    private intervalId: NodeJS.Timeout | null = null;

    private constructor() {
        this.rettiwt = new Rettiwt({ apiKey: process.env.TWITTER_API_KEY! });
    }

    public static getInstance(): TwitterPoller {
        if (!TwitterPoller.instance) {
            TwitterPoller.instance = new TwitterPoller();
        }
        return TwitterPoller.instance;
    }

    public start() {
        if (this.intervalId) return;

        const poll = async () => {
            try {
                const result = await this.rettiwt.tweet.search({ fromUsers: ['nasa'] }, 10);
                this.cachedTweets = result.list;
            } catch (error) {
                console.error('Polling error:', error);
            }
        };

        poll(); // Initial fetch
        this.intervalId = setInterval(poll, 15000);
    }

    public getCachedTweets() {
        return this.cachedTweets;
    }

    public shutdown() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        this.rettiwt.destroy();
    }
}

export const twitterPoller = TwitterPoller.getInstance();
```

**`pages/api/tweets.ts`:**
```typescript
import type { NextApiRequest, NextApiResponse } from 'next';
import { twitterPoller } from '@/lib/twitter-poller';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const tweets = twitterPoller.getCachedTweets();
    res.status(200).json({ tweets, count: tweets.length });
}
```

**Start polling when app starts** (add to `pages/_app.tsx` or server startup):
```typescript
import { twitterPoller } from '@/lib/twitter-poller';

// Start polling when app initializes
if (typeof window === 'undefined') {
    twitterPoller.start();
}
```

## 📊 Memory Monitoring

While polling is running, monitor memory in another terminal:

```bash
# Watch memory usage
watch -n 1 'ps aux | grep node | grep -v grep'

# Watch connection count
watch -n 1 'netstat -an | grep ESTABLISHED | grep x.com | wc -l'
```

**Expected behavior:**
- Memory: Stays constant (~180-200MB)
- Connections: Max 10 idle connections
- CPU: Returns to idle between polls

## ❌ Common Mistakes

### DON'T do this (creates memory leak):
```typescript
// ❌ BAD: Creating new instance every 15 seconds
setInterval(async () => {
    const rettiwt = new Rettiwt({ apiKey: API_KEY }); // NEW INSTANCE!
    await rettiwt.tweet.search({ fromUsers: ['nasa'] });
    // No destroy() - memory leak!
}, 15000);
```

### DO this (correct way):
```typescript
// ✅ GOOD: Create once, reuse forever
const rettiwt = new Rettiwt({ apiKey: API_KEY });

setInterval(async () => {
    await rettiwt.tweet.search({ fromUsers: ['nasa'] });
}, 15000);

// Destroy only on shutdown
process.on('SIGINT', () => rettiwt.destroy());
```

## 🎛️ Advanced Options

### Adjust polling interval:
```typescript
const INTERVALS = {
    fast: 5000,      // 5 seconds
    normal: 15000,   // 15 seconds
    slow: 60000,     // 1 minute
};

setInterval(poll, INTERVALS.normal);
```

### Add retry logic:
```typescript
const poll = async () => {
    let retries = 3;
    while (retries > 0) {
        try {
            const tweets = await rettiwt.tweet.search({ fromUsers: ['nasa'] }, 10);
            console.log(`Success: ${tweets.list.length} tweets`);
            break;
        } catch (error) {
            retries--;
            if (retries === 0) {
                console.error('Failed after 3 retries:', error);
            } else {
                console.log(`Retrying... (${retries} left)`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
};
```

### Fetch only new tweets:
```typescript
let lastTweetId: string | undefined;

const poll = async () => {
    const tweets = await rettiwt.tweet.search(
        { 
            fromUsers: ['nasa'],
            sinceId: lastTweetId  // Only tweets after this ID
        },
        10
    );
    
    if (tweets.list.length > 0) {
        lastTweetId = tweets.list[0].id;
        console.log(`Found ${tweets.list.length} NEW tweets`);
    }
};
```

## 🐛 Troubleshooting

### "Still seeing memory increase"
- Make sure you're creating only ONE Rettiwt instance
- Check that you're not calling `destroy()` inside the polling loop
- Verify `npm run build` was successful

### "Polling stops after errors"
- Add try-catch blocks to prevent crashes
- Implement retry logic
- Log errors but continue polling

### "Connection refused / Rate limit errors"
- Add delay between requests: `delay: 1000` in config
- Reduce polling frequency temporarily
- Check your API key is valid

## 📝 Summary

**For 15-second polling:**
1. ✅ Create ONE Rettiwt instance
2. ✅ Use `setInterval()` to poll every 15 seconds
3. ✅ Call `destroy()` only on shutdown
4. ✅ Use try-catch for error handling
5. ✅ Monitor memory to verify it's stable

That's it! Your memory will stay constant, and you can poll indefinitely. 🚀
