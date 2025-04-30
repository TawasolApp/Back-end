import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PlanType } from '../../../enums/plan-type.enum';

export type PlanDetailDocument = PlanDetail & Document;

@Schema({ timestamps: false, versionKey: false })
export class PlanDetail {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(PlanType),
  })
  plan_type: PlanType;

  @Prop()
  start_date: Date;

  @Prop()
  expiry_date?: Date; // set for one time plans

  @Prop()
  auto_renewal: boolean; // true for subscription, false for one time

  @Prop()
  cancel_date?: Date; // set for both plans
}

export const PlanDetailSchema = SchemaFactory.createForClass(PlanDetail);

PlanDetailSchema.index({ user_id: 1 });

PlanDetailSchema.set('collection', 'PlanDetails');
