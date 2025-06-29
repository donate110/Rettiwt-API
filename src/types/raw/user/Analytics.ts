/* eslint-disable */

/**
 * The raw data received when fetching the analytic overview of the user.
 *
 * @public
 */
export interface IUserAnalyticsResponse {
	data: Data;
}

interface Data {
	viewer_v2: ViewerV2;
}

interface ViewerV2 {
	user_results: UserResults;
}

interface UserResults {
	id: string;
	result: Result;
}


interface Result {
	__typename: string;
	organic_metrics_time_series: Series[];
	verified_follower_count: string;
	relationship_counts: Relationships;
	id: string;
}

interface Relationships {
	followers: number;
}

interface Series {
	metric_values: MetricValue[];
	timestamp: Timestamp;
}

interface MetricValue {
	metric_value: number;
	metric_type: string;
}

interface Timestamp {
	iso8601_time: string;
}
