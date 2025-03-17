import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RepostDocument = Repost & Document;

@Schema({ timestamps: false, versionKey: false })
export class Repost {
  @Prop({ required: true })
  authorId: string;

  @Prop({ required: true })
  postId: string;

  @Prop()
  content: string;

  @Prop({ type: [String], default: [] })
  taggedUsers: string[];

  @Prop({ enum: ['Public', 'Connections', 'Private'], required: true })
  visibility: string;

  @Prop({ enum: ['User', 'Company'], required: true })
  authorType: string;
}

export const RepostSchema = SchemaFactory.createForClass(Repost);

RepostSchema.set('collection', 'Reposts');
