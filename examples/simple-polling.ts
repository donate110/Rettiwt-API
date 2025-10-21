/**
 * Simple Twitter Polling Script
 *
 * Fetches tweets every 15 seconds without memory leaks.
 * Ready to use - just add your API key and search filter.
 */

import { Rettiwt } from 'rettiwt-api';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
	apiKey: process.env.TWITTER_API_KEY || 'YOUR_API_KEY_HERE',
	pollingInterval: 15000, // 15 seconds
	tweetCount: 10,
	filter: {
		fromUsers: ['nasa', 'spacex'], // Change this to your target users
		// Or use other filters:
		// keywords: ['bitcoin'],
		// hashtags: ['nodejs'],
		// startDate: new Date('2024-01-01'),
	},
};

// ============================================================================
// Main Polling Logic
// ============================================================================

async function main() {
	console.log('🚀 Starting Twitter Polling Service');
	console.log(`📊 Polling interval: ${CONFIG.pollingInterval / 1000} seconds`);
	console.log(`🎯 Target users: ${CONFIG.filter.fromUsers?.join(', ')}`);
	console.log('─'.repeat(60));

	// Create ONE Rettiwt instance for all polling (this is key!)
	const rettiwt = new Rettiwt({ apiKey: CONFIG.apiKey });

	let pollCount = 0;

	// Polling function
	const poll = async () => {
		pollCount++;
		const timestamp = new Date().toISOString();

		try {
			console.log(`\n[Poll #${pollCount}] ${timestamp}`);
			console.log('🔍 Fetching tweets...');

			const result = await rettiwt.tweet.search(CONFIG.filter, CONFIG.tweetCount);

			console.log(`✅ Found ${result.list.length} tweets`);

			// Process the tweets
			result.list.forEach((tweet, index) => {
				console.log(`\n  ${index + 1}. @${tweet.tweetBy.userName} (${tweet.createdAt})`);
				console.log(`     ${tweet.fullText.substring(0, 100)}${tweet.fullText.length > 100 ? '...' : ''}`);
				console.log(`     ❤️  ${tweet.likeCount} | 🔁 ${tweet.retweetCount} | 💬 ${tweet.replyCount}`);
			});

			console.log(`\n⏱️  Next poll in ${CONFIG.pollingInterval / 1000} seconds...`);
		} catch (error: any) {
			console.error('❌ Error during polling:', error.message);
			console.log('⏱️  Will retry in 15 seconds...');
		}
	};

	// Start polling
	console.log('\n⏳ Running initial poll...');
	await poll(); // Run immediately

	const intervalId = setInterval(poll, CONFIG.pollingInterval);

	// Graceful shutdown handler
	const shutdown = () => {
		console.log('\n\n🛑 Shutting down gracefully...');
		clearInterval(intervalId);
		rettiwt.destroy(); // IMPORTANT: Clean up resources!
		console.log('✅ Cleanup complete');
		console.log(`📈 Total polls completed: ${pollCount}`);
		process.exit(0);
	};

	// Handle shutdown signals (Ctrl+C, kill command, etc.)
	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);

	console.log('\n💡 Press Ctrl+C to stop\n');
}

// ============================================================================
// Run
// ============================================================================

// Check if API key is set
if (CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
	console.error('❌ Error: Please set your Twitter API key');
	console.error('   Either:');
	console.error('   1. Set TWITTER_API_KEY environment variable');
	console.error('   2. Or edit CONFIG.apiKey in this file');
	process.exit(1);
}

// Start the polling service
main().catch((error) => {
	console.error('❌ Fatal error:', error);
	process.exit(1);
});
