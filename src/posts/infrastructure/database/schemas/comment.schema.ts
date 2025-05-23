import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { React } from './react.schema';

export type CommentDocument = Comment & Document;

// @Schema({ _id: false })
// export class Reply {
//   @Prop({ enum: ['User', 'Company'], required: true })
//   author_type: string;

//   @Prop({ type: Types.ObjectId, required: true, refPath: 'author_type' })
//   author_id: Types.ObjectId;

//   @Prop()
//   content: string;

//   @Prop({ type: [{ type: Types.ObjectId, ref: 'React' }], default: [] })
//   reacts: Types.ObjectId[];

//   @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
//   tags: Types.ObjectId[];
// }

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

  @Prop({ type: [Types.ObjectId], default: [] })
  replies: Types.ObjectId[];

  @Prop({
    type: Object,
    default: {
      Like: 0,
      Love: 0,
      Funny: 0,
      Celebrate: 0,
      Insightful: 0,
      Support: 0,
    },
  })
  react_count: {
    Like: number;
    Love: number;
    Funny: number;
    Celebrate: number;
    Insightful: number;
    Support: number;
  };

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  tags: Types.ObjectId[];

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  commented_at: Date;

  @Prop({ default: false })
  is_edited: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.set('collection', 'Comments');
