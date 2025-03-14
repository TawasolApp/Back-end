import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: { createdAt: 'posted_at', updatedAt: 'editted_at' }, versionKey: false })
export class Post {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creator: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], default: [] })
  media: string[];

  @Prop({ default: 0 })
  react_count: number;

  @Prop({ default: 0 })
  comment_count: number;

  @Prop({ default: 0 })
  share_count: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  tags: Types.ObjectId[];
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.set('collection', 'Posts');