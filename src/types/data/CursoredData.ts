import { IConversation } from './Conversation';
import { IDirectMessage } from './DirectMessage';
import { IList } from './List';
import { INotification } from './Notification';
import { ITweet } from './Tweet';
import { IUser } from './User';

/**
 * The data that is fetched batch-wise using a cursor.
 *
 * @typeParam T - Type of data to be stored.
 *
 * @public
 */
export interface ICursoredData<T extends IDirectMessage | IConversation | INotification | ITweet | IUser | IList> {
	/** The batch of data of the given type. */
	list: T[];

	/** The cursor to the next batch of data. */
	next: string;

	/** The rate limit quota */
	rateLimit?: number;

	/** The remaining rate limit quota */
	rateLimitRemaining?: number;

	/** The timestamp when the rate limit resets (Unix timestamp in seconds) */
	rateLimitReset?: number;
}
