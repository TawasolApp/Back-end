import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  ValidationPipe,
  UnauthorizedException,
  Delete,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import { UpgradePlanDto } from './dtos/upgrade-plan.dto';

@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
@Controller('premium-plan')
export class PaymentsController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async upgradeToPremium(
    @Req() request: Request,
    @Body() upgradePlanDto: UpgradePlanDto,
  ) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = request.user['sub'];
    return await this.paymentService.createCheckoutSession(
      userId,
      upgradePlanDto,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancelPlan(@Req() request: Request) {
    if (!request.user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const userId = request.user['sub'];
    await this.paymentService.cancelPlan(userId);
  }
}
