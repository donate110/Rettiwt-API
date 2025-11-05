import { IRateLimitInfo } from './RateLimitInfo';

/**
 * Response wrapper that includes rate limit information.
 *
 * @public
 */
export interface IResponseWithRateLimit<T> {
	/** The response data */
	data: T;

	/** Rate limit information from response headers */
	rateLimit?: IRateLimitInfo;
}
