import { IConversation } from '../../types/data/Conversation';
import { IInboxInitialResponse } from '../../types/raw/dm/InboxInitial';

/**
 * The details of a single conversation.
 *
 * @public
 */
export class Conversation implements IConversation {
	/** The raw conversation details. */
	private readonly _raw: unknown;

	public avatarUrl?: string;
	public hasMore: boolean;
	public id: string;
	public lastActivityAt: string;
	public lastMessageId?: string;
	public muted: boolean;
	public name?: string;
	public notificationsDisabled: boolean;
	public participants: string[];
	public trusted: boolean;
	public type: 'ONE_TO_ONE' | 'GROUP_DM';

	/**
	 * @param conversation - The raw conversation details from the API response.
	 */
	public constructor(conversation: unknown) {
		this._raw = { ...conversation as Record<string, unknown> };

		const conv = conversation as Record<string, unknown>;

		this.id = conv.conversation_id && typeof conv.conversation_id === 'string' ? conv.conversation_id : '';
		this.type = (conv.type as 'ONE_TO_ONE' | 'GROUP_DM') || 'ONE_TO_ONE';
		
		const participants = conv.participants as Array<Record<string, unknown>> | undefined;
		this.participants = participants?.map((p) => p.user_id && typeof p.user_id === 'string' ? p.user_id : '') || [];
		
		this.name = conv.name && typeof conv.name === 'string' ? conv.name : undefined;
		
		const avatar = conv.avatar as Record<string, unknown> | undefined;
		const image = avatar?.image as Record<string, unknown> | undefined;
		const originalInfo = image?.original_info as Record<string, unknown> | undefined;
		this.avatarUrl = (conv.avatar_image_https && typeof conv.avatar_image_https === 'string')
			? conv.avatar_image_https 
			: (originalInfo?.url && typeof originalInfo.url === 'string')
				? originalInfo.url 
				: undefined;
		
		this.trusted = Boolean(conv.trusted);
		this.muted = Boolean(conv.muted);
		this.notificationsDisabled = Boolean(conv.notifications_disabled);
		this.lastActivityAt = conv.sort_timestamp 
			? new Date(Number(conv.sort_timestamp)).toISOString()
			: new Date().toISOString();
		this.lastMessageId = conv.sort_event_id && typeof conv.sort_event_id === 'string' ? conv.sort_event_id : undefined;
		this.hasMore = conv.status === 'HAS_MORE';
	}

	/** The raw conversation details. */
	public get raw(): unknown {
		return { ...this._raw as Record<string, unknown> };
	}

	/**
	 * Extracts and deserializes the list of conversations from the given raw response data.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized list of conversations.
	 */
	public static list(response: NonNullable<unknown>): Conversation[] {
		const conversations: Conversation[] = [];

		// Handle inbox initial state response
		const inboxResponse = response as IInboxInitialResponse;
		if (inboxResponse.inbox_initial_state?.conversations) {
			const rawConversations = inboxResponse.inbox_initial_state.conversations;
			for (const [, conversation] of Object.entries(rawConversations)) {
				conversations.push(new Conversation(conversation));
			}
		}

		return conversations;
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IConversation {
		return {
			avatarUrl: this.avatarUrl,
			hasMore: this.hasMore,
			id: this.id,
			lastActivityAt: this.lastActivityAt,
			lastMessageId: this.lastMessageId,
			muted: this.muted,
			name: this.name,
			notificationsDisabled: this.notificationsDisabled,
			participants: this.participants,
			trusted: this.trusted,
			type: this.type,
		};
	}
}