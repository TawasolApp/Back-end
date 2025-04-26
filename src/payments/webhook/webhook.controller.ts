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
import { PaymentsService } from '../payments.service';
import { BadRequestException } from '@nestjs/common';

@Controller('webhook')
export class WebhookController {
  private stripe: Stripe;
  private readonly endpointSecret: string;
  constructor(private readonly paymentService: PaymentsService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    this.endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
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
