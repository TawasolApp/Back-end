import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaveDocument = Save & Document;

@Schema({
  timestamps: { createdAt: 'saved_at', updatedAt: false },
  versionKey: false,
})
export class Save {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId;

  @Prop()
  saved_at: Date;
}

export const SaveSchema = SchemaFactory.createForClass(Save);

SaveSchema.set('collection', 'Saves');
