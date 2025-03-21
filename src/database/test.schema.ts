import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TestDocument = Test & Document;

@Schema({
  timestamps: false,
  versionKey: false,
})
export class Test {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: String })
  message: Types.ObjectId;

  @Prop({
    type: String,
    default: () => new Date().toISOString(),
  })
  created_at: string;
}

export const TestSchema = SchemaFactory.createForClass(Test);
TestSchema.set('collection', 'Tests');
