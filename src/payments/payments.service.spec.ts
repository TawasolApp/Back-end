import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { Payment } from './infrastructure/database/schemas/payment.schema';
import { PlanDetail } from './infrastructure/database/schemas/plan-detail.schema';
import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
import { PlanType } from './enums/plan-type.enum';
import { MessagesGateway } from '../gateway/messages.gateway';
import { handleError } from '../common/utils/exception-handler';
import { Types } from 'mongoose';
import { ConflictException, BadRequestException } from '@nestjs/common';

jest.mock('../common/utils/exception-handler', () => ({
  handleError: jest.fn(),
}));

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockPaymentModel = { findOne: jest.fn(), create: jest.fn() };
  const mockPlanDetailModel = {
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const mockProfileModel = {
    findById: jest.fn(),
    updateOne: jest.fn(),
  };
  const mockMessagesGateway = { updatePremiumStatus: jest.fn() };

  const stripeMock = {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    subscriptions: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getModelToken(Payment.name), useValue: mockPaymentModel },
        {
          provide: getModelToken(PlanDetail.name),
          useValue: mockPlanDetailModel,
        },
        { provide: getModelToken(Profile.name), useValue: mockProfileModel },
        { provide: MessagesGateway, useValue: mockMessagesGateway },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);

    // Inject the mocked Stripe instance directly
    (service as any).stripe = stripeMock;

    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for non-premium user', async () => {
      mockProfileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({ is_premium: false }),
      });

      stripeMock.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout.stripe.com/session',
      });

      const result = await service.createCheckoutSession('mockUserId', {
        planType: PlanType.Monthly,
        autoRenewal: true,
      });

      expect(result.checkoutSessionUrl).toBe('https://checkout.stripe.com/session');
    });

    it('should throw ConflictException if user is already premium', async () => {
      mockProfileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({ is_premium: true }),
      });

      await service.createCheckoutSession('mockUserId', {
        planType: PlanType.Monthly,
        autoRenewal: true,
      });

      expect(handleError).toHaveBeenCalledWith(
        expect.any(ConflictException),
        'Failed to create stripe checkout session.',
      );
    });
  });

  describe('handlePaymentSuccess', () => {
    it('should create plan and payment, update profile and notify gateway', async () => {
      const mockPlanId = new Types.ObjectId();

      const session = {
        metadata: {
          userId: 'mockUserId',
          planType: PlanType.Monthly,
          autoRenewal: 'true',
        },
        amount_total: 7000,
        id: 'sess_123',
        payment_intent: 'pi_123',
        subscription: 'sub_123',
      };

      mockPlanDetailModel.create.mockResolvedValue({ _id: mockPlanId });
      mockPaymentModel.create.mockResolvedValue({});
      mockProfileModel.updateOne.mockResolvedValue({});

      await service.handlePaymentSuccess(session as any);

      expect(mockPlanDetailModel.create).toHaveBeenCalled();
      expect(mockPaymentModel.create).toHaveBeenCalled();
      expect(mockProfileModel.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(Types.ObjectId) },
        { $set: { is_premium: true } },
      );
      expect(mockMessagesGateway.updatePremiumStatus).toHaveBeenCalledWith(
        'mockUserId',
        true,
      );
    });
  });

  describe('cancelPlan', () => {
    it('should cancel a renewable plan and update user', async () => {
      const planMock = {
        _id: new Types.ObjectId(),
        auto_renewal: true,
        save: jest.fn(),
        cancel_date: null,
      };

      mockProfileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({ is_premium: true }),
      });

      mockPlanDetailModel.findOne.mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue(planMock),
      });

      mockPaymentModel.findOne = jest.fn().mockReturnValueOnce({
        sort: jest.fn().mockResolvedValue({ subscription_id: 'sub_123' }),
      });

      stripeMock.subscriptions.update.mockResolvedValue({});

      await service.cancelPlan('mockUserId');

      expect(planMock.save).toHaveBeenCalled();
      expect(mockProfileModel.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(Types.ObjectId) },
        { $set: { is_premium: false } },
      );
      expect(mockMessagesGateway.updatePremiumStatus).toHaveBeenCalledWith(
        'mockUserId',
        false,
      );
    });

    it('should throw BadRequestException if user is not premium', async () => {
      mockProfileModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({ is_premium: false }),
      });

      await service.cancelPlan('mockUserId');

      expect(handleError).toHaveBeenCalledWith(
        expect.any(BadRequestException),
        'Failed to cancel premium plan.',
      );
    });
  });
});
