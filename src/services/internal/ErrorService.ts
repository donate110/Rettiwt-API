import { AxiosError, isAxiosError } from 'axios';

import { TwitterError } from '../../models/errors/TwitterError';
import { IErrorHandler } from '../../types/ErrorHandler';
import { IErrorData as IRawErrorData } from '../../types/raw/base/Error';

/**
 * The base service that handles any errors.
 *
 * @public
 */
export class ErrorService implements IErrorHandler {
	private handleAxiosError(error: AxiosError<IRawErrorData>): void {
		throw new TwitterError(error);
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
			this.handleAxiosError(error as AxiosError<IRawErrorData>);
		} else {
			this.handleUnknownError();
		}
	}
}
