import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ConnectionStatus } from '../../../enums/connection-status.enum';

export type UserConnectionDocument = UserConnection & Document;

@Schema({
  timestamps: false,
  versionKey: false,
})
export class UserConnection {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sending_party: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  receiving_party: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ConnectionStatus),
    required: true,
  })
  status: ConnectionStatus;

  @Prop({
    type: String,
    default: () => new Date().toISOString(),
  })
  created_at: string;
}

export const UserConnectionSchema =
  SchemaFactory.createForClass(UserConnection);
UserConnectionSchema.set('collection', 'UserConnections');
