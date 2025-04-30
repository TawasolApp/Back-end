import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: false },
  versionKey: false,
})
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true })
  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    enum: ['customer', 'employer', 'manager', 'admin'],
    default: 'customer',
  })
  role: string;

  @Prop({ default: false })
  is_verified: boolean;

  @Prop({ default: false })
  is_social_login: boolean;

  @Prop({ type: [String], default: [] })
  fcm_tokens: string[];

  @Prop()
  created_at: Date;

  @Prop({ default: false })
  is_suspended: boolean;

  @Prop({ type: Date, default: null }) 
  suspension_end_date: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('collection', 'Users');
