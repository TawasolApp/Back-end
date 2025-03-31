import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RepostDocument = Repost & Document;

@Schema({ timestamps: false, versionKey: false })
export class Repost {
  @Prop({ required: true })
  autho_id: string;

  @Prop({ required: true })
  post_id: string;

  @Prop()
  content: string;

  @Prop({ type: [String], default: [] })
  tagged_users: string[];

  @Prop({ enum: ['Public', 'Connections', 'Private'], required: true })
  visibility: string;

  @Prop({ enum: ['User', 'Company'], required: true })
  author_type: string;
}

export const RepostSchema = SchemaFactory.createForClass(Repost);

RepostSchema.set('collection', 'Reposts');
