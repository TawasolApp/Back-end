import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { React } from './react.schema';

export type CommentDocument = Comment & Document;

@Schema({ _id: false })
export class Reply {
  @Prop({ enum: ['User', 'Company'], required: true })
  author_type: string;

  @Prop({ type: Types.ObjectId, required: true, refPath: 'author_type' })
  author_id: Types.ObjectId;

  @Prop()
  content: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'React' }], default: [] })
  reacts: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  tags: Types.ObjectId[];
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
  author_id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  post_id: Types.ObjectId;

  @Prop({ type: [Reply], default: [] })
  replies: Reply[];

  @Prop({ default: 0 })
  react_count: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  tags: Types.ObjectId[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.set('collection', 'Comments');
