import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { CursoredData } from '../../models/data/CursoredData';
import { DirectMessage } from '../../models/data/DirectMessage';
import { RettiwtConfig } from '../../models/RettiwtConfig';
import { IConversationTimelineResponse } from '../../types/raw/dm/Conversation';
import { IInboxInitialResponse } from '../../types/raw/dm/InboxInitial';
import { IInboxTimelineResponse } from '../../types/raw/dm/InboxTimeline';

import { FetcherService } from './FetcherService';

/**
 * Handles interacting with resources related to direct messages
 *
 * @public
 */
export class DirectMessageService extends FetcherService {
	/**
	 * @param config - The config object for configuring the Rettiwt instance.
	 *
	 * @internal
	 */
	public constructor(config: RettiwtConfig) {
		super(config);
	}

  /**
	 * Get the full conversation history for a specific conversation.
	 * Use this to load complete message history for a conversation identified from the inbox.
	 *
	 * @param conversationId - The ID of the conversation (e.g., "394028042-1712730991884689408").
	 * @param cursor - The cursor for pagination (maxId from previous response).
	 *
	 * @returns The conversation timeline with messages.
	 *
	 * @example
	 *
	 * ```ts
	 * import { Rettiwt } from 'rettiwt-api';
	 *
	 * // Creating a new Rettiwt instance using the given 'API_KEY'
	 * const rettiwt = new Rettiwt({ apiKey: API_KEY });
	 *
	 * // Fetching a specific conversation
	 * rettiwt.dm.conversation('394028042-1712730991884689408')
	 * .then(res => {
	 * 	console.log(res);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async conversation(conversationId: string, cursor?: string): Promise<CursoredData<DirectMessage>> {
		const resource = ResourceType.DM_CONVERSATION;

		// Fetching raw conversation timeline
		const response = await this.request<IConversationTimelineResponse>(resource, {
			conversationId: conversationId,
			maxId: cursor,
		});

		// Deserializing response
		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the initial state of the DM inbox, including recent conversations and messages.
	 * This is the main entry point for the DM system following the "Inbox as Entry Point" pattern.
	 *
	 * @returns The initial DM inbox state with recent messages and conversations.
	 *
	 * @example
	 *
	 * ```ts
	 * import { Rettiwt } from 'rettiwt-api';
	 *
	 * // Creating a new Rettiwt instance using the given 'API_KEY'
	 * const rettiwt = new Rettiwt({ apiKey: API_KEY });
	 *
	 * // Fetching the initial DM inbox state
	 * rettiwt.dm.inbox()
	 * .then(res => {
	 * 	console.log(res);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async inbox(): Promise<CursoredData<DirectMessage>> {
		const resource = ResourceType.DM_INBOX_INITIAL_STATE;

		// Fetching raw inbox initial state
		const response = await this.request<IInboxInitialResponse>(resource, {});

		// Deserializing response
		const data = Extractors[resource](response);

		return data;
	}


  
	/**
	 * Get more conversations from the inbox timeline (for pagination).
	 * Use this to load older conversations beyond what's included in the initial inbox state.
	 *
	 * @param cursor - The cursor to the batch of conversations to fetch (maxId from previous response).
	 *
	 * @returns The inbox timeline with older conversations.
	 *
	 * @example
	 *
	 * ```ts
	 * import { Rettiwt } from 'rettiwt-api';
	 *
	 * // Creating a new Rettiwt instance using the given 'API_KEY'
	 * const rettiwt = new Rettiwt({ apiKey: API_KEY });
	 *
	 * // Fetching older conversations using pagination
	 * rettiwt.dm.inboxTimeline('1803853649426133349')
	 * .then(res => {
	 * 	console.log(res);
	 * })
	 * .catch(err => {
	 * 	console.log(err);
	 * });
	 * ```
	 */
	public async inboxTimeline(cursor?: string): Promise<CursoredData<DirectMessage>> {
		const resource = ResourceType.DM_INBOX_TIMELINE;

		// Fetching raw inbox timeline
		const response = await this.request<IInboxTimelineResponse>(resource, {
			maxId: cursor,
		});

		// Deserializing response
		const data = Extractors[resource](response);

		return data;
	}

	

	/**
	 * Stream new DM updates in pseudo real-time by polling the user updates endpoint.
	 * This can be used to detect new messages and conversation changes.
	 *
	 * @param pollingInterval - The interval in milliseconds to poll for new updates. Default interval is 30000 ms (30 seconds).
	 * @param activeConversationId - ID of the currently active conversation for context-aware updates.
	 *
	 * @returns An async generator that yields new messages as they are received.
	 *
	 * @example
	 *
	 * ```ts
	 * import { Rettiwt } from 'rettiwt-api';
	 *
	 * // Creating a new Rettiwt instance using the given 'API_KEY'
	 * const rettiwt = new Rettiwt({ apiKey: API_KEY });
	 *
	 * // Creating a function that streams all new DM updates
	 * async function streamDMUpdates() {
	 * 	try {
	 * 		// Awaiting for the messages returned by the AsyncGenerator
	 * 		for await (const message of rettiwt.dm.streamUpdates(10000)) {
	 * 			console.log(`New message: ${message.text}`);
	 * 		}
	 * 	}
	 * 	catch (err) {
	 * 		console.log(err);
	 * 	}
	 * }
	 *
	 * // Calling the function
	 * streamDMUpdates();
	 * ```
	 */
	public async *streamUpdates(pollingInterval = 30000, activeConversationId?: string): AsyncGenerator<DirectMessage> {
		const resource = ResourceType.DM_USER_UPDATES;

		/** Whether it's the first batch of updates or not. */
		let first = true;

		/** The cursor to the last update received. */
		let cursor: string | undefined = undefined;

		while (true) {
			// Pause execution for the specified polling interval before proceeding to the next iteration
			await new Promise((resolve) => setTimeout(resolve, pollingInterval));

			// Get the batch of updates after the given cursor
			const response = await this.request<IInboxInitialResponse>(resource, {
				cursor: cursor,
				activeConversationId: activeConversationId,
			});

			// Deserializing response
			const updates = Extractors[resource](response);

			// Sorting the messages by time, from oldest to recent
			updates.list.sort((a, b) => new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf());

			// If not first batch, return new messages
			if (!first) {
				// Yield the new messages
				for (const message of updates.list) {
					yield message;
				}
			}
			// Else do nothing since first batch contains messages that have already been received
			else {
				first = false;
			}

			cursor = updates.next;
		}
	}
}