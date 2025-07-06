import { IDirectMessage } from '../../types/data/DirectMessage';
import { IConversationTimelineResponse } from '../../types/raw/dm/Conversation';
import { IInboxInitialResponse } from '../../types/raw/dm/InboxInitial';
import { IInboxTimelineResponse } from '../../types/raw/dm/InboxTimeline';

/**
 * The details of a single direct message.
 *
 * @public
 */
export class DirectMessage implements IDirectMessage {
	/** The raw message details. */
	private readonly _raw: unknown;

	public conversationId: string;
	public createdAt: string;
	public editCount?: number;
	public id: string;
	public mediaUrls?: string[];
	public read?: boolean;
	public recipientId?: string;
	public senderId: string;
	public text: string;

	/**
	 * @param message - The raw message details from the API response.
	 */
	public constructor(message: unknown) {
		this._raw = { ...message as Record<string, unknown> };

		const msg = message as Record<string, unknown>;
		const messageData = msg.message_data as Record<string, unknown> | undefined;

		this.id = String((messageData?.id && typeof messageData.id === 'string' ? messageData.id : '') || 
						(msg.id && typeof msg.id === 'string' ? msg.id : '') || '');
		this.conversationId = String((msg.conversation_id && typeof msg.conversation_id === 'string' ? msg.conversation_id : '') || 
							 (messageData?.conversation_id && typeof messageData.conversation_id === 'string' ? messageData.conversation_id : '') || '');
		this.senderId = String((messageData?.sender_id && typeof messageData.sender_id === 'string' ? messageData.sender_id : '') || 
						(msg.sender_id && typeof msg.sender_id === 'string' ? msg.sender_id : '') || '');
		this.recipientId = (messageData?.recipient_id && typeof messageData.recipient_id === 'string' ? messageData.recipient_id : undefined) ||
						   (msg.recipient_id && typeof msg.recipient_id === 'string' ? msg.recipient_id : undefined);
		this.text = String((messageData?.text && typeof messageData.text === 'string' ? messageData.text : '') || 
					(msg.text && typeof msg.text === 'string' ? msg.text : '') || '');
		this.createdAt = msg.time 
			? new Date(Number(msg.time)).toISOString() 
			: messageData?.time 
				? new Date(Number(messageData.time)).toISOString() 
				: new Date().toISOString();
		this.editCount = Number(messageData?.edit_count) || 0;
		this.mediaUrls = this._extractMediaUrls(message);
		this.read = true; // Default to true, can be enhanced later
	}

	/** The raw message details. */
	public get raw(): unknown {
		return { ...this._raw as Record<string, unknown> };
	}

	/**
	 * Extract media URLs from message attachment data.
	 */
	private _extractMediaUrls(message: unknown): string[] | undefined {
		const urls: string[] = [];
		const msg = message as Record<string, unknown>;
		const messageData = msg.message_data as Record<string, unknown> | undefined;
		
		// Check for card attachments with images
		const attachment = messageData?.attachment as Record<string, unknown> | undefined;
		const card = attachment?.card as Record<string, unknown> | undefined;
		const bindingValues = card?.binding_values as Record<string, unknown> | undefined;

		if (bindingValues) {
			const thumbnailImage = bindingValues.thumbnail_image as Record<string, unknown> | undefined;
			const photoImageFullSize = bindingValues.photo_image_full_size as Record<string, unknown> | undefined;

			if (thumbnailImage?.image_value) {
				const imageValue = thumbnailImage.image_value as Record<string, unknown>;
				if (imageValue.url && typeof imageValue.url === 'string') {
					urls.push(imageValue.url);
				}
			}
			if (photoImageFullSize?.image_value) {
				const imageValue = photoImageFullSize.image_value as Record<string, unknown>;
				if (imageValue.url && typeof imageValue.url === 'string') {
					urls.push(imageValue.url);
				}
			}
		}

		return urls.length > 0 ? urls : undefined;
	}

	/**
	 * Extracts and deserializes the list of direct messages from the given raw response data.
	 *
	 * @param response - The raw response data.
	 *
	 * @returns The deserialized list of direct messages.
	 */
	public static list(response: NonNullable<unknown>): DirectMessage[] {
		const messages: DirectMessage[] = [];

		// Handle inbox initial state response
		const inboxResponse = response as IInboxInitialResponse;
		if (inboxResponse.inbox_initial_state?.entries) {
			const entries = inboxResponse.inbox_initial_state.entries;
			for (const entry of entries) {
				if ('message' in entry && entry.message) {
					messages.push(new DirectMessage(entry.message));
				}
			}
		}

		// Handle conversation timeline response
		const conversationResponse = response as IConversationTimelineResponse;
		if (conversationResponse.conversation_timeline?.entries) {
			const entries = conversationResponse.conversation_timeline.entries;
			for (const entry of entries) {
				if ('message' in entry && entry.message) {
					messages.push(new DirectMessage(entry.message));
				}
			}
		}

		// Handle inbox timeline response
		const timelineResponse = response as IInboxTimelineResponse;
		if (timelineResponse.inbox_timeline?.entries) {
			const entries = timelineResponse.inbox_timeline.entries;
			for (const entry of entries) {
				if ('message' in entry && entry.message) {
					messages.push(new DirectMessage(entry.message));
				}
			}
		}

		return messages;
	}

	/**
	 * @returns A serializable JSON representation of `this` object.
	 */
	public toJSON(): IDirectMessage {
		return {
			conversationId: this.conversationId,
			createdAt: this.createdAt,
			editCount: this.editCount,
			id: this.id,
			mediaUrls: this.mediaUrls,
			read: this.read,
			recipientId: this.recipientId,
			senderId: this.senderId,
			text: this.text,
		};
	}
}