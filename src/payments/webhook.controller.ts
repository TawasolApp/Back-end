import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import Stripe from 'stripe';
import { PaymentsService } from './payments.service';
import { BadRequestException } from '@nestjs/common';

@Controller('webhook')
export class WebhookController {
  private stripe: Stripe;
  private readonly endpointSecret: string;
  constructor(private readonly paymentService: PaymentsService) {
    // this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    // this.endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
    this.stripe = new Stripe(
      'sk_test_51RGSKsRxKmlmf6E0fkG88mb8kL7R7sDwmlsquKH1MRIjAgWfqt61uuoBfqXeaQc7683YPpQP5FoEZ4LX4VYt31hk00NdyOorkD',
    );
    this.endpointSecret =
      'whsec_c8d703f5c77103835d2e00880911fc69ece3822e0fd43d77807e1c843a4e853e';
  }

  @Post('stripe')
  @HttpCode(HttpStatus.OK)
  async handleStripeWebhook(
    @Req() request: Request,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: Stripe.Event;
    const rawBody = (request as any).rawBody;
    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.endpointSecret,
      );
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        `Webhook signature verification failed: ${error.message}`,
      );
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.paymentService.handlePaymentSuccess(session);
    }
  }
}
