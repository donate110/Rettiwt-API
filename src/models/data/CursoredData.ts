import { BaseType } from '../../enums/Data';

import { findByFilter } from '../../helper/JsonUtils';

import { ICursoredData } from '../../types/data/CursoredData';
import { ICursor as IRawCursor } from '../../types/raw/base/Cursor';

import { Conversation } from './Conversation';
import { DirectMessage } from './DirectMessage';
import { Notification } from './Notification';
import { Tweet } from './Tweet';
import { User } from './User';

/**
 * The data that is fetched batch-wise using a cursor.
 *
 * @typeParam T - Type of data to be stored.
 *
 * @public
 */
export class CursoredData<T extends Conversation | DirectMessage | Notification | Tweet | User> implements ICursoredData<T> {
	public list: T[];
	public next: string;

	/**
	 * @param response - The raw response.
	 * @param type - The base type of the data included in the batch.
	 */
	public constructor(response: NonNullable<unknown>, type: BaseType) {
		// Initializing defaults
		this.list = [];
		this.next = '';

		if (type == BaseType.DIRECT_MESSAGE) {
			this.list = DirectMessage.list(response) as T[];
			// For DM responses, we need to extract cursor differently depending on the response type
			this.next = this._extractDMCursor(response);
		} else if (type == BaseType.TWEET) {
			this.list = Tweet.timeline(response) as T[];
			this.next = findByFilter<IRawCursor>(response, 'cursorType', 'Bottom')[0]?.value ?? '';
		} else if (type == BaseType.USER) {
			this.list = User.timeline(response) as T[];
			this.next = findByFilter<IRawCursor>(response, 'cursorType', 'Bottom')[0]?.value ?? '';
		} else if (type == BaseType.NOTIFICATION) {
			this.list = Notification.list(response) as T[];
			this.next = findByFilter<IRawCursor>(response, 'cursorType', 'Top')[0]?.value ?? '';
		}
	}

	/**
	 * Extract cursor from DM responses which have different structures.
	 */
	private _extractDMCursor(response: NonNullable<unknown>): string {
		const resp = response as Record<string, unknown>;
		
		// Check for inbox_initial_state cursor
		const inboxState = resp.inbox_initial_state as Record<string, unknown> | undefined;
		if (inboxState?.cursor && typeof inboxState.cursor === 'string') {
			return inboxState.cursor;
		}
		
		// Check for conversation_timeline min_entry_id for pagination
		const conversationTimeline = resp.conversation_timeline as Record<string, unknown> | undefined;
		if (conversationTimeline?.min_entry_id && typeof conversationTimeline.min_entry_id === 'string') {
			return conversationTimeline.min_entry_id;
		}
		
		// Check for inbox_timeline min_entry_id for pagination
		const inboxTimeline = resp.inbox_timeline as Record<string, unknown> | undefined;
		if (inboxTimeline?.min_entry_id && typeof inboxTimeline.min_entry_id === 'string') {
			return inboxTimeline.min_entry_id;
		}
		
		// Check for user_events cursor
		const userEvents = resp.user_events as Record<string, unknown> | undefined;
		if (userEvents?.cursor && typeof userEvents.cursor === 'string') {
			return userEvents.cursor;
		}
		
		return '';
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): ICursoredData<T> {
		return {
			list: this.list.map((item) => item.toJSON() as T),
			next: this.next,
		};
	}
}
