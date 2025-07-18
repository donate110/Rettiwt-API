import { ConversationMessage } from './Conversation';
import { Message } from './InboxInitial';
import { TimelineMessage } from './InboxTimeline';

// Extract the message_data types
type ConversationMessageData = ConversationMessage['message_data'];
type InboxMessageData = Message['message_data'];
type TimelineMessageData = TimelineMessage['message_data'];

// Create unified message_data type that includes all possible fields
type UnifiedMessageData = InboxMessageData & Partial<ConversationMessageData> & Partial<TimelineMessageData>;

/* eslint-disable @typescript-eslint/naming-convention */
export interface IRawMessageBase {
	id: string;
	time: string;
	affects_sort?: boolean;
	request_id: string;
	conversation_id: string;
	message_data: UnifiedMessageData;
}
/* eslint-enable @typescript-eslint/naming-convention */
