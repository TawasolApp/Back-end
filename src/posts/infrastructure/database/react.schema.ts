import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReactDocument = React & Document;

@Schema({ timestamps: { createdAt: 'reacted_at', updatedAt: false }, versionKey: false })
export class React {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ enum: ['like', 'love', 'laugh', 'clap'], required: true })
  type: string;
}

export const ReactSchema = SchemaFactory.createForClass(React);

ReactSchema.set('collection', 'Reacts');