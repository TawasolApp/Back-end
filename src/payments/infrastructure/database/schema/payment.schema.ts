import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: false },
  versionKey: false,
})
export class Payment {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'PlanDetail', required: true })
  plan_id: Types.ObjectId;

  @Prop()
  amount: number;

  @Prop()
  status: boolean; // 1 for success, 0 for failed

  @Prop()
  transaction_id?: string;
  
  @Prop()
  session_id?: string;

  @Prop()
  payment_intent_id?: string;

  @Prop()
  charge_id?: string;

  @Prop()
  subscription_id?: string; // auto-renewal plans

  @Prop()
  created_at: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.set('collection', 'Payments');
