import { AxiosError, isAxiosError } from 'axios';

import { IErrorHandler } from '../../types/ErrorHandler';

/**
 * The base service that handles any errors.
 *
 * @public
 */
export class ErrorService implements IErrorHandler {
	private handleAxiosError(error: AxiosError): void {
		throw new Error(error.message);
	}

	private handleUnknownError(): void {
		throw new Error('Unknown error');
	}

	/**
	 * The method called when an error response is received from Twitter API.
	 *
	 * @param error - The error caught while making HTTP request to Twitter API.
	 */
	public handle(error: unknown): void {
		if (isAxiosError(error)) {
			this.handleAxiosError(error as AxiosError);
		} else {
			this.handleUnknownError();
		}
	}
}
