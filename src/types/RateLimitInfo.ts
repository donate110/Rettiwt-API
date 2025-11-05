/**
 * Rate limit information from response headers.
 *
 * @public
 */
export interface IRateLimitInfo {
	/** The rate limit quota */
	limit?: number;

	/** The remaining rate limit quota */
	remaining?: number;

	/** The timestamp when the rate limit resets (Unix timestamp in seconds) */
	reset?: number;
}
