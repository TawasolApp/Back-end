// import {
//   Controller,
//   Post,
//   Body,
//   Res,
//   Req,
//   Headers,
//   HttpCode,
// } from '@nestjs/common';
// import { StripeService } from './stripe.service';
// import { PlanType } from './enums/plan-type.enum';
// import { Response, Request } from 'express';
// import Stripe from 'stripe';
// import { ConfigService } from '@nestjs/config';

// @Controller('payments')
// export class PaymentController {
//   constructor(
//     private readonly stripeService: StripeService,
//     private readonly configService: ConfigService,
//   ) {}

//   // 1. Start the payment process
//   @Post('create-session')
//   async createSession(
//     @Body('userId') userId: string,
//     @Body('planType') planType: PlanType,
//     @Body('autoRenewal') autoRenewal: boolean,
//   ) {
//     const url = await this.stripeService.createCheckoutSession(
//       userId,
//       planType,
//       autoRenewal,
//     );
//     return { url };
//   }

//   // 2. Stripe calls this endpoint after payment (webhook)
//   @Post('webhook')
//   @HttpCode(200)
//   async handleWebhook(
//     @Req() req: Request,
//     @Res() res: Response,
//     @Headers('stripe-signature') sig: string,
//   ) {
//     const stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
//       apiVersion: '2023-10-16',
//     });

//     let event: Stripe.Event;

//     try {
//       event = stripe.webhooks.constructEvent(
//         req.body,
//         sig,
//         this.configService.get('STRIPE_WEBHOOK_SECRET'),
//       );
//     } catch (err) {
//       return res.status(400).send(`Webhook Error: ${err.message}`);
//     }

//     if (event.type === 'checkout.session.completed') {
//       const session = event.data.object as Stripe.Checkout.Session;
//       await this.stripeService.handlePaymentSuccess(session);
//     }

//     return res.send({ received: true });
//   }

//   // 3. Cancel subscription (auto-renewal)
//   @Post('cancel-subscription')
//   async cancelSubscription(@Body('subscriptionId') subscriptionId: string) {
//     const result = await this.stripeService.cancelSubscription(subscriptionId);
//     return { success: result };
//   }

//   @Post('cancel-plan')
//   async cancelPlan(@Body('userId') userId: string) {
//     const success = await this.stripeService.cancelPlan(userId);
//     return { success };
//   }
// }
