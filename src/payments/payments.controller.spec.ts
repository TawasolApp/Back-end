import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { UpgradePlanDto } from './dtos/upgrade-plan.dto';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PlanType } from './enums/plan-type.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Types } from 'mongoose';

const mockJwtAuthGuard: CanActivate = {
  canActivate: (context: ExecutionContext) => true,
};

const profileId1 = new Types.ObjectId();
const profileId2 = new Types.ObjectId();

const mockProfiles = [
  { _id: profileId1, is_premium: false },
  { _id: profileId2, is_premium: true },
];

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPaymentsService = {
    createCheckoutSession: jest.fn(),
    cancelPlan: jest.fn(),
  };

  const mockUser0Request = {
    user: { sub: mockProfiles[0]._id.toString() },
  } as any;

  const mockUser1Request = {
    user: { sub: mockProfiles[1]._id.toString() },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: mockPaymentsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
    jest.clearAllMocks();
  });

  describe('upgradeToPremium', () => {
    it('should call paymentService.createCheckoutSession with correct args', async () => {
      const dto: UpgradePlanDto = {
        planType: PlanType.Monthly,
        autoRenewal: true,
      };
      const mockResponse = {
        checkoutSessionUrl: 'https://checkout.stripe.com/session',
      };
      mockPaymentsService.createCheckoutSession.mockResolvedValue(mockResponse);
      const result = await controller.upgradeToPremium(mockUser0Request, dto);
      expect(service.createCheckoutSession).toHaveBeenCalledWith(
        mockUser0Request.user.sub,
        dto,
      );
      expect(result).toBe(mockResponse);
    });

    it('should throw UnauthorizedException if no user in request', async () => {
      const dto: UpgradePlanDto = {
        planType: PlanType.Monthly,
        autoRenewal: true,
      };
      const invalidRequest = {} as any;
      await expect(
        controller.upgradeToPremium(invalidRequest, dto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ConflictException if service detects user is already premium', async () => {
      const dto: UpgradePlanDto = {
        planType: PlanType.Monthly,
        autoRenewal: true,
      };
      mockPaymentsService.createCheckoutSession.mockRejectedValue(
        new ConflictException('User is already on a premium plan.'),
      );
      await expect(
        controller.upgradeToPremium(mockUser1Request, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should propagate errors from paymentService', async () => {
      mockPaymentsService.createCheckoutSession.mockRejectedValue(
        new Error('Stripe Failed.'),
      );
      await expect(
        controller.upgradeToPremium(mockUser0Request, {
          planType: PlanType.Monthly,
          autoRenewal: true,
        }),
      ).rejects.toThrow('Stripe Failed.');
    });
  });

  describe('cancelPlan', () => {
    it('should call paymentService.cancelPlan with correct user ID', async () => {
      await controller.cancelPlan(mockUser1Request);
      expect(service.cancelPlan).toHaveBeenCalledWith(
        mockUser1Request.user.sub,
      );
    });

    it('should throw UnauthorizedException if no user in request', async () => {
      const invalidRequest = {} as any;
      await expect(controller.cancelPlan(invalidRequest)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException if service detects no active plan', async () => {
      mockPaymentsService.cancelPlan.mockRejectedValue(
        new BadRequestException('User does not have any active plans.'),
      );
      await expect(controller.cancelPlan(mockUser0Request)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should propagate errors from paymentService', async () => {
      mockPaymentsService.cancelPlan.mockRejectedValue(
        new Error('Stripe Failed.'),
      );
      await expect(controller.cancelPlan(mockUser0Request)).rejects.toThrow(
        'Stripe Failed.',
      );
    });
  });
});
