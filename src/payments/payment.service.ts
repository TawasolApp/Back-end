import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Payment,
  PaymentDocument,
} from './infrastructure/database/schema/payment.schema';
import {
  PlanDetail,
  PlanDetailDocument,
} from './infrastructure/database/schema/plan-detail.schema';
import { PlanType } from './enums/plan-type.enum';
import { UpgradePlanDto } from './dtos/upgrade-plan.dto';
import { handleError } from '../common/utils/exception-handler';
import {
  Profile,
  ProfileDocument,
} from '../profiles/infrastructure/database/schemas/profile.schema';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  private readonly MONTHLY_PRICE = 70;
  private readonly YEARLY_PRICE = 700;
  private readonly CURRENCY = 'EGP';
  private readonly SUCCESS_URL = 'http://localhost:3000/payment-success';
  private readonly CANCEL_URL = 'http://localhost:3000/payment-cancel';

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(PlanDetail.name)
    private planDetailModel: Model<PlanDetailDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }

  async createCheckoutSession(userId: string, upgradePlanDto: UpgradePlanDto) {
    try {
      const { planType, autoRenewal } = upgradePlanDto;
      const amount =
        planType === PlanType.Monthly ? this.MONTHLY_PRICE : this.YEARLY_PRICE;
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: autoRenewal ? 'subscription' : 'payment',
        line_items: [
          {
            price_data: {
              currency: this.CURRENCY,
              product_data: {
                name: `Premium Plan - ${planType}`,
              },
              unit_amount: amount,
              recurring: autoRenewal
                ? { interval: planType === PlanType.Monthly ? 'month' : 'year' }
                : undefined,
            },
            quantity: 1,
          },
        ],
        metadata: { userId, planType, autoRenewal: String(autoRenewal) },
        success_url: this.SUCCESS_URL,
        cancel_url: this.CANCEL_URL,
      });
      return session.url;
    } catch (error) {
      handleError(error, 'Failed to create stripe checkout session.');
    }
  }

  async handlePaymentSuccess(session: Stripe.Checkout.Session) {
    try {
      const userId = session.metadata?.userId;
      const planType = session.metadata?.planType as PlanType;
      const autoRenewal = session.metadata?.autoRenewal === 'true';
      const existingPlan = await this.planDetailModel.findOne({
        user_id: new Types.ObjectId(userId),
        $or: [
          { auto_renewal: true, cancel_date: null },
          { auto_renewal: false, expiry_date: { $gte: new Date() } },
        ],
      });
      if (existingPlan) {
        throw new ConflictException('User already has an active plan.');
      }
      const startDate = new Date();
      const expiryDate = !autoRenewal
        ? new Date(
            startDate.getFullYear(),
            startDate.getMonth() + (planType === PlanType.Monthly ? 1 : 12),
            startDate.getDate(),
          )
        : undefined;
      const plan = await this.planDetailModel.create({
        user_id: new Types.ObjectId(userId),
        plan_type: planType,
        start_date: startDate,
        expiry_date: expiryDate,
        auto_renewal: autoRenewal,
        cancel_date: null,
      });
      await this.paymentModel.create({
        plan_id: plan._id,
        amount: session.amount_total! / 100,
        is_success: true,
        session_id: session.id,
        payment_intent_id: session.payment_intent as string,
        subscription_id: session.subscription as string,
        created_at: new Date(),
      });
      await this.profileModel.updateOne(
        { _id: new Types.ObjectId(userId) },
        { $set: { is_premium: true } },
      );
    } catch (error) {
      handleError(error, 'Failed to handle successful payment.');
    }
  }

  async cancelPlan(userId: string) {
    try {
      const activePlan = await this.planDetailModel.findOne({
        user_id: new Types.ObjectId(userId),
        $or: [
          { auto_renewal: true, cancel_date: null },
          { auto_renewal: false, expiry_date: { $gte: new Date() } },
        ],
      });
      if (!activePlan) {
        throw new BadRequestException('User does not have any active plans.');
      }
      const payment = await this.paymentModel
        .findOne({ plan_id: activePlan._id })
        .sort({ created_at: -1 });
      if (activePlan.auto_renewal && payment?.subscription_id) {
        await this.stripe.subscriptions.update(payment.subscription_id, {
          cancel_at_period_end: true,
        });
      }
      activePlan.cancel_date = new Date();
      await activePlan.save();
      await this.profileModel.updateOne(
        { _id: new Types.ObjectId(userId) },
        { $set: { is_premium: false } },
      );
    } catch (error) {
      handleError(error, 'Failed to cancel premium plan.');
    }
  }
}
