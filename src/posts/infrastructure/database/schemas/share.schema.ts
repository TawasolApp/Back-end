import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ShareDocument = Share & Document;

@Schema({
  timestamps: { createdAt: 'shared_at', updatedAt: false },
  versionKey: false,
})
export class Share {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop()
  shared_at: Date;
}

export const ShareSchema = SchemaFactory.createForClass(Share);

ShareSchema.set('collection', 'Shares');
