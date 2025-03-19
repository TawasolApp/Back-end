import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReactDocument = React & Document;

@Schema({
  timestamps: { createdAt: 'reacted_at', updatedAt: false },
  versionKey: false,
})
export class React {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ enum: ['User', 'Company'], required: true })
  user_type: string;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'user_type' })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId;

  @Prop({ enum: ['Post', 'Comment'] })
  post_type: string;

  @Prop({ enum: ['Like', 'Love', 'Laugh', 'Clap'], required: true })
  react_type: string;
}

export const ReactSchema = SchemaFactory.createForClass(React);

ReactSchema.set('collection', 'Reacts');
