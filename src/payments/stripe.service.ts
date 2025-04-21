import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(PlanDetail.name)
    private planDetailModel: Model<PlanDetailDocument>,
  ) {
    // stripe initialised with secret key
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {});
  }

  // stripe checkout session created for one-time or recurring payment
  async createCheckoutSession(
    userId: string,
    planType: PlanType,
    autoRenewal: boolean,
  ) {
    const amount = planType === PlanType.Monthly ? 1000 : 10000;
    const currency = 'EGP';

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: autoRenewal ? 'subscription' : 'payment',
      line_items: [
        {
          price_data: {
            currency,
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
      success_url: 'http://localhost:3000/payment-success',
      cancel_url: 'http://localhost:3000/payment-cancel',
    });
    return session.url;
  }

  // called by stripe via webhook after successful payment
  async handlePaymentSuccess(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId;
    const planType = session.metadata?.planType as PlanType;
    const autoRenewal = session.metadata?.autoRenewal === 'true';

    // create PlanDetails record
    const startDate = new Date();
    const expiryDate = startDate;
    expiryDate.setMonth(
      expiryDate.getMonth() + (planType === PlanType.Monthly ? 1 : 12),
    );

    const plan = await this.planDetailModel.create({
      user_id: new Types.ObjectId(userId),
      plan_type: planType,
      start_date: startDate,
      expiry_date: expiryDate,
      auto_renewal: autoRenewal,
      cancel_date: null,
    });

    // save payment
    await this.paymentModel.create({
      plan_id: plan._id,
      amount: session.amount_total! / 100,
      status: 'Success',
      transaction_id: session.id,
      session_id: session.id,
      subscription_id: session.subscription as string,
      created_at: new Date(),
    });
  }

  // cancel an existing auto-renewal subscription
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    const cancelled = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return cancelled.cancel_at_period_end === true;
  }

  // cancel any type of plan manually (keep privileges until expiry_date)
  async cancelPlan(userId: string): Promise<boolean> {
    // find the active plan
    const plan = await this.planDetailModel.findOne({ user_id: userId });
    if (!plan) return false;
    // find latest payment linked to that plan
    const payment = await this.paymentModel
      .findOne({ plan_id: plan._id })
      .sort({ created_at: -1 });
    // cancel on stripe (for subscriptions)
    if (plan.auto_renewal && payment?.subscription_id) {
      await this.stripe.subscriptions.update(payment.subscription_id, {
        cancel_at_period_end: true,
      });
    }
    // set cancel_date
    plan.cancel_date = new Date();
    await plan.save();
    return true;
  }
}
