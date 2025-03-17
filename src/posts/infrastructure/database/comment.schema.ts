import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ _id: false })
export class Reply {
  @Prop({ enum: ['User', 'Company'], required: true })
  author_type: string;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'author_type' })
  author: Types.ObjectId;

  @Prop()
  content: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'React' }], default: [] })
  reacts: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  tags: Types.ObjectId[];
}

@Schema({ _id: false })
export class React {
  @Prop({ enum: ['User', 'Company'], required: true })
  user_type: string;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'user_type' })
  user: Types.ObjectId;

  @Prop({ enum: ['like', 'love', 'laugh', 'clap'], required: true })
  type: string;
}

@Schema({
  timestamps: { createdAt: 'commented_at', updatedAt: false },
  versionKey: false,
})
export class Comment {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ enum: ['User', 'Company'], required: true })
  author_type: string;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'author_type' })
  author: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post: Types.ObjectId;

  @Prop({ type: [Reply], default: [] })
  replies: Reply[];

  @Prop({ type: [React], default: [] })
  reacts: React[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  tags: Types.ObjectId[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.set('collection', 'Comments');