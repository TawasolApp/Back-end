import { Types } from 'mongoose';
import { MessageStatus } from '../enums/message-status.enum';

export class GetMessageDto {
  _id: Types.ObjectId;
  senderId: Types.ObjectId;
  conversationId: Types.ObjectId;
  text: string;
  media: string[];
  status: MessageStatus;
  sentAt: Date;
}
