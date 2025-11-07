import { Rettiwt } from 'rettiwt-api-node';
import 'dotenv/config';

const rettiwt = new Rettiwt({ apiKey: process.env.ACCESS_TOKEN });

async function searchTweets() {
	try {
		console.log('Starting search...');
		const result = await rettiwt.tweet.search(
			{
				includeWords: ['$BTC'],
				onlyOriginal: true,
			},
			20,
		);
		console.log('Search successful!');
		console.log(result.list[0].entities);
		console.log('Tweets:', result.list.length);
		console.log('Next cursor:', result.next);
		console.log('Rate limit:', result.rateLimit);
		console.log('Rate limit remaining:', result.rateLimitRemaining);
		console.log('Rate limit reset:', result.rateLimitReset);
	} catch (error) {
		console.error('Error searching tweets:', error.message);
		if (error.cause) {
			console.error('Error cause:', error.cause);
		}
		if (error.response) {
			console.error('Error response:', error.response);
		}
		console.error('Full error:', error);
	}
}

await searchTweets();
