import { forwardRef, Module, ValidationPipe } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { WebhookController } from './webhook.controller';
import { APP_PIPE } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { UsersModule } from '../users/users.module';
import { Payment, PaymentSchema } from './infrastructure/database/schema/payment.schema';
import { PlanDetail, PlanDetailSchema } from './infrastructure/database/schema/plan-detail.schema';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: PlanDetail.name, schema: PlanDetailSchema },
    ]),
    AuthModule,
    UsersModule,
    ProfilesModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [MongooseModule, PaymentsService],
  providers: [
    PaymentsService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  controllers: [PaymentsController, WebhookController],
})
export class PaymentsModule {}