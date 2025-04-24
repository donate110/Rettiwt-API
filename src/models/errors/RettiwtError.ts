/**
 * Represents an error that arises inside the package.
 */
export class RettiwtError extends Error {
	/**
	 * @param message - The error message.
	 */
	public constructor(message?: string) {
		super(message);

		Object.setPrototypeOf(this, RettiwtError.prototype);
	}
}
