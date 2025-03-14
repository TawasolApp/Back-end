import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserConnectionDocument = UserConnection & Document;

@Schema({ timestamps: { createdAt: 'connected_at', updatedAt: false }, versionKey: false })
export class UserConnection {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sending_party: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiving_party: Types.ObjectId;

  @Prop({ enum: ['pending', 'connected', 'following', 'blocked'], required: true })
  status: string;
}

export const UserConnectionSchema = SchemaFactory.createForClass(UserConnection);

UserConnectionSchema.set('collection', 'UserConnections');