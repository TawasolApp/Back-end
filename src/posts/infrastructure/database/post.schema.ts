import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({
  timestamps: { createdAt: 'posted_at', updatedAt: 'editted_at' },
  versionKey: false,
})
export class Post {
  // @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author_id: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], default: [] })
  media: string[];

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

  @Prop({ default: 0 })
  comment_count: number;

  @Prop({ default: 0 })
  share_count: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  tags: Types.ObjectId[];

  @Prop({ enum: ['Public', 'Connections', 'Private'], default: 'Public' })
  visibility: string;

  @Prop({ enum: ['User', 'Company'], required: true })
  author_type: string;

  @Prop({ type: Date, default: () => new Date().toISOString() })
  posted_at: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);

PostSchema.set('collection', 'Posts');
