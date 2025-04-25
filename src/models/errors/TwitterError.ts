import { AxiosError } from 'axios';

import { IErrorData as IRawErrorData, IErrorDetails as IRawErrorDetails } from '../../types/raw/base/Error';

export class TwitterError extends Error {
	public details: TwitterErrorDetails[];
	public message: string;
	public name: string;
	public status: number;

	public constructor(error: AxiosError<IRawErrorData>) {
		super(error.message);
		this.details = error.response?.data.errors.map((item) => new TwitterErrorDetails(item)) ?? [];
		this.message = error.message;
		this.name = 'TWITTER_ERROR';
		this.status = error.status ?? 500;
	}
}

export class TwitterErrorDetails {
	public code: number;
	public message: string;
	public name: string;
	public type: string;

	public constructor(details: IRawErrorDetails) {
		this.code = details.code;
		this.message = details.message;
		this.name = details.name;
		this.type = details.kind;
	}
}
