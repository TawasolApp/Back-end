import { GetMessageDto } from './get-message.dto';

export class GetConversationDto {
  _id: string;
  lastMessage: GetMessageDto; // You can define a LastMessageDto if you want
  unseenCount: number;
  otherParticipant: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
  markedAsUnread: boolean; // Added this field to indicate if the conversation is marked as unread
}
