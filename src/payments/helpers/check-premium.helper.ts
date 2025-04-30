import { Types, Model } from 'mongoose';
import { PlanDetailDocument } from '../../payments/infrastructure/database/schema/plan-detail.schema';
import { PlanType } from '../../payments/enums/plan-type.enum';

export async function isPremium(
  userId: string,
  planDetailModel: Model<PlanDetailDocument>,
): Promise<boolean> {
  const now = new Date();
  const plan = await planDetailModel
    .findOne({ user_id: new Types.ObjectId(userId) })
    .sort({ start_date: -1 });

  if (!plan) return false; // no plan record exists
  if (!plan.auto_renewal) {
    // one-time plan
    if (!plan.expiry_date) return false;
    if (!plan.cancel_date && plan.expiry_date > now) return true;
    if (
      plan.cancel_date &&
      plan.expiry_date > now &&
      plan.expiry_date > plan.cancel_date
    )
      return true;
  } else {
    // auto-renewal plan
    if (!plan.cancel_date) return true;
    const cycle = plan.plan_type === PlanType.Monthly ? 1 : 12; // billing cycle in months for auto-renewal plan
    const monthsElapsed = getMonthsBetween(plan.start_date, plan.cancel_date);
    const nextRenewalDate = new Date(plan.start_date);
    nextRenewalDate.setMonth(
      plan.start_date.getMonth() + cycle * (monthsElapsed + 1),
    );
    if (now < nextRenewalDate) return true;
  }
  return false;
}

function getMonthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    (end.getDate() >= start.getDate() ? 0 : -1)
  );
}
