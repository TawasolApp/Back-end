// import { Test, TestingModule } from '@nestjs/testing';
// import { getModelToken } from '@nestjs/mongoose';
// import { PaymentsService } from './payments.service';
// import { Payment } from './infrastructure/database/schemas/payment.schema';
// import { PlanDetail } from './infrastructure/database/schemas/plan-detail.schema';
// import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
// import { PlanType } from './enums/plan-type.enum';
// import { MessagesGateway } from '../gateway/messages.gateway';
// import { handleError } from '../common/utils/exception-handler';
// import { Types } from 'mongoose';
// import { ConflictException, BadRequestException } from '@nestjs/common';
// import Stripe from 'stripe';

// jest.mock('../common/utils/exception-handler', () => ({
//   handleError: jest.fn(),
// }));

// const profileId1 = new Types.ObjectId();
// const profileId2 = new Types.ObjectId();

// const mockProfiles = [
//   { _id: profileId1, is_premium: false },
//   { _id: profileId2, is_premium: true },
// ];

// describe('PaymentsService', () => {
//   let service: PaymentsService;
//   let planDetailModel: any;
//   let paymentModel: any;
//   let profileModel: any;

//   const mockPaymentModel = {
//     create: jest.fn(),
//     findOne: jest.fn(),
//   };

//   const mockPlanDetailModel = {
//     create: jest.fn(),
//     findOne: jest.fn(),
//   };

//   const mockProfileModel = {
//     updateOne: jest.fn(),
//     findById: jest.fn().mockReturnValue({
//       lean: jest.fn().mockResolvedValue(undefined),
//     }),
//   };

//   const mockMessagesGateway = { updatePremiumStatus: jest.fn() };

//   const stripeMock = {
//     checkout: {
//       sessions: {
//         create: jest.fn(),
//       },
//     },
//     subscriptions: {
//       update: jest.fn(),
//     },
//   };

//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         PaymentsService,
//         { provide: getModelToken(Payment.name), useValue: mockPaymentModel },
//         {
//           provide: getModelToken(PlanDetail.name),
//           useValue: mockPlanDetailModel,
//         },
//         { provide: getModelToken(Profile.name), useValue: mockProfileModel },
//         { provide: MessagesGateway, useValue: mockMessagesGateway },
//       ],
//     }).compile();

//     service = module.get<PaymentsService>(PaymentsService);
//     (service as any).stripe = stripeMock;
//     jest.clearAllMocks();
//   });

//   describe('createCheckoutSession', () => {
//     it('should create checkout session for non-premium user', async () => {
//       profileModel.findById.mockReturnValueOnce({
//         lean: jest.fn().mockResolvedValueOnce(mockProfiles[0]),
//       });
//       stripeMock.checkout.sessions.create.mockResolvedValue({
//         url: 'https://checkout.stripe.com/session',
//       });
//       const result = await service.createCheckoutSession(mockProfiles[0]._id.toString(), {
//         planType: PlanType.Monthly,
//         autoRenewal: true,
//       });
//       expect(result.checkoutSessionUrl).toBe(
//         'https://checkout.stripe.com/session',
//       );
//     });

//     // it('should throw ConflictException if user is already premium', async () => {
//     //   mockProfileModel.findById.mockReturnValueOnce({
//     //     lean: jest.fn().mockResolvedValue({ is_premium: true }),
//     //   });

//     //   await service.createCheckoutSession('mockUserId', {
//     //     planType: PlanType.Monthly,
//     //     autoRenewal: true,
//     //   });

//     //   expect(handleError).toHaveBeenCalledWith(
//     //     expect.any(ConflictException),
//     //     'Failed to create stripe checkout session.',
//     //   );
//     // });
//   });

// //   describe('handlePaymentSuccess', () => {
// //     it('should create plan and payment, update profile and notify gateway', async () => {
// //       const mockPlanId = new Types.ObjectId();

// //       const session = {
// //         metadata: {
// //           userId: 'mockUserId',
// //           planType: PlanType.Monthly,
// //           autoRenewal: 'true',
// //         },
// //         amount_total: 7000,
// //         id: 'sess_123',
// //         payment_intent: 'pi_123',
// //         subscription: 'sub_123',
// //       };

// //       mockPlanDetailModel.create.mockResolvedValue({ _id: mockPlanId });
// //       mockPaymentModel.create.mockResolvedValue({});
// //       mockProfileModel.updateOne.mockResolvedValue({});

// //       await service.handlePaymentSuccess(session as any);

// //       expect(mockPlanDetailModel.create).toHaveBeenCalled();
// //       expect(mockPaymentModel.create).toHaveBeenCalled();
// //       expect(mockProfileModel.updateOne).toHaveBeenCalledWith(
// //         { _id: expect.any(Types.ObjectId) },
// //         { $set: { is_premium: true } },
// //       );
// //       expect(mockMessagesGateway.updatePremiumStatus).toHaveBeenCalledWith(
// //         'mockUserId',
// //         true,
// //       );
// //     });
// //   });

// //   describe('cancelPlan', () => {
// //     it('should cancel a renewable plan and update user', async () => {
// //       const planMock = {
// //         _id: new Types.ObjectId(),
// //         auto_renewal: true,
// //         save: jest.fn(),
// //         cancel_date: null,
// //       };

// //       mockProfileModel.findById.mockReturnValueOnce({
// //         lean: jest.fn().mockResolvedValue({ is_premium: true }),
// //       });

// //       mockPlanDetailModel.findOne.mockReturnValueOnce({
// //         sort: jest.fn().mockResolvedValue(planMock),
// //       });

// //       mockPaymentModel.findOne = jest.fn().mockReturnValueOnce({
// //         sort: jest.fn().mockResolvedValue({ subscription_id: 'sub_123' }),
// //       });

// //       stripeMock.subscriptions.update.mockResolvedValue({});

// //       await service.cancelPlan('mockUserId');

// //       expect(planMock.save).toHaveBeenCalled();
// //       expect(mockProfileModel.updateOne).toHaveBeenCalledWith(
// //         { _id: expect.any(Types.ObjectId) },
// //         { $set: { is_premium: false } },
// //       );
// //       expect(mockMessagesGateway.updatePremiumStatus).toHaveBeenCalledWith(
// //         'mockUserId',
// //         false,
// //       );
// //     });

// //     it('should throw BadRequestException if user is not premium', async () => {
// //       mockProfileModel.findById.mockReturnValueOnce({
// //         lean: jest.fn().mockResolvedValue({ is_premium: false }),
// //       });

// //       await service.cancelPlan('mockUserId');

// //       expect(handleError).toHaveBeenCalledWith(
// //         expect.any(BadRequestException),
// //         'Failed to cancel premium plan.',
// //       );
// //     });
// //   });
// });

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
import Stripe from 'stripe';

jest.mock('../common/utils/exception-handler', () => ({
  handleError: jest.fn(),
}));

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          url: 'https://checkout.stripe.com/session',
          id: 'session_id',
          payment_intent: 'pi_123',
          subscription: 'sub_123',
          amount_total: 7000,
        }),
      },
    },
    subscriptions: {
      update: jest.fn().mockResolvedValue({}),
    },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let stripeMock: jest.Mocked<Stripe>;

  const mockPaymentModel = {
    create: jest.fn().mockResolvedValue({}),
    findOne: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue({ subscription_id: 'sub_123' }),
    }),
  };

  const mockPlanDetailModel = {
    create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    findOne: jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue({
        _id: new Types.ObjectId(),
        auto_renewal: true,
        save: jest.fn(),
        cancel_date: null,
      }),
    }),
  };

  const mockProfileModel = {
    updateOne: jest.fn().mockResolvedValue({}),
    findById: jest.fn().mockImplementation((id) => {
      if (id.toString() === '64d8f5f3b851e70b5a6a78a9') {
        return {
          lean: jest.fn().mockResolvedValue({ is_premium: true }),
        };
      }
      return {
        lean: jest.fn().mockResolvedValue({ is_premium: false }),
      };
    }),
  };

  const mockMessagesGateway = {
    updatePremiumStatus: jest.fn(),
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
        {
          provide: 'STRIPE_CONFIG',
          useValue: {
            secretKey: 'test_key',
            apiVersion: '2025-04-30.basil',
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    stripeMock = (service as any).stripe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for non-premium user', async () => {
      const result = await service.createCheckoutSession(
        '64d8f5f3b851e70b5a6a78a8', // non-premium user
        {
          planType: PlanType.Monthly,
          autoRenewal: true,
        },
      );

      expect(result.checkoutSessionUrl).toBe('https://checkout.stripe.com/session');
      expect(stripeMock.checkout.sessions.create).toHaveBeenCalled();
      expect(mockProfileModel.findById).toHaveBeenCalled();
    });

    it('should throw ConflictException if user is already premium', async () => {
      await expect(
        service.createCheckoutSession('64d8f5f3b851e70b5a6a78a9', { // premium user
          planType: PlanType.Monthly,
          autoRenewal: true,
        }),
      ).rejects.toThrow(ConflictException);

      expect(mockProfileModel.findById).toHaveBeenCalled();
    });
  });

  describe('handlePaymentSuccess', () => {
    it('should create plan and payment, update profile and notify gateway', async () => {
      const session = {
        metadata: {
          userId: '64d8f5f3b851e70b5a6a78a8',
          planType: PlanType.Monthly,
          autoRenewal: 'true',
        },
        amount_total: 7000,
        id: 'sess_123',
        payment_intent: 'pi_123',
        subscription: 'sub_123',
      };

      await service.handlePaymentSuccess(session as any);

      expect(mockPlanDetailModel.create).toHaveBeenCalled();
      expect(mockPaymentModel.create).toHaveBeenCalled();
      expect(mockProfileModel.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(Types.ObjectId) },
        { $set: { is_premium: true } },
      );
      expect(mockMessagesGateway.updatePremiumStatus).toHaveBeenCalledWith(
        '64d8f5f3b851e70b5a6a78a8',
        true,
      );
    });
  });

  describe('cancelPlan', () => {
    it('should cancel a renewable plan and update user', async () => {
      await service.cancelPlan('64d8f5f3b851e70b5a6a78a9');

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true,
      });
      expect(mockPlanDetailModel.findOne).toHaveBeenCalled();
      expect(mockProfileModel.updateOne).toHaveBeenCalledWith(
        { _id: expect.any(Types.ObjectId) },
        { $set: { is_premium: false } },
      );
      expect(mockMessagesGateway.updatePremiumStatus).toHaveBeenCalledWith(
        '64d8f5f3b851e70b5a6a78a9',
        false,
      );
    });

    it('should throw BadRequestException if user is not premium', async () => {
      await expect(service.cancelPlan('64d8f5f3b851e70b5a6a78a8')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});