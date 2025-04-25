/* eslint-disable */

/**
 * Represents the raw data of an error response.
 *
 * @public
 */
export interface IError {
	status: number;
	statusText: string;
	data: IErrorData | IErrorDetails;
}

export interface IErrorData {
	errors: IErrorDetails[];
}

export interface IErrorDetails {
	message: string;
	extensions?: IErrorExtensions;
	code: number;
	kind?: string;
	name?: string;
	source?: string;
	tracing?: IErrorTracing;
}

export interface IErrorExtensions {
	name: string;
	source: string;
	code: number;
	kind: string;
	tracing: IErrorTracing;
}

export interface IErrorTracing {
	trace_id: string;
}
