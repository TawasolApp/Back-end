import { GetConversationDto } from './get-conversation.dto';
import { GetMessageDto } from './get-message.dto';
import { Types } from 'mongoose';
export function getConversations(conversations: any[]): GetConversationDto[] {
  return conversations.map((conversation) => {
    // Determine if the OTHER participant marked it as unread

    return {
      _id: conversation._id.toString(),
      lastMessage: getMessage(conversation.lastMessage),
      unseenCount: conversation.unseen_count || 0,
      markedAsUnread: conversation.markedAsUnread,
      otherParticipant: {
        _id: conversation.otherParticipant._id,
        firstName: conversation.otherParticipant.first_name,
        lastName: conversation.otherParticipant.last_name,
        profilePicture: conversation.otherParticipant.profile_picture ?? null,
      },
    };
  });
}
function getMessage(message: any): GetMessageDto {
  return {
    _id: new Types.ObjectId(message._id),
    senderId: new Types.ObjectId(message.sender_id),
    receiverId: new Types.ObjectId(message.receiver_id),
    conversationId: new Types.ObjectId(message.conversation_id),
    text: message.text,
    media: message.media ?? [],
    status: message.status,
    sentAt: new Date(message.sent_at),
  };
}

export function getMessages(messages: any[]): GetMessageDto[] {
  return messages.map((message) => getMessage(message));
}
