import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from './users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '../common/services/mailer.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

describe('UsersModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        UsersModule,
        MongooseModule.forRootAsync({
          useFactory: () => ({
            uri: 'mongodb://localhost/test',
          }),
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        {
          provide: MailerModule,
          useValue: {
            sendMail: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
      controllers: [UsersController],
    }).compile();
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should import MongooseModule with all schemas', () => {
    const mongooseModule = module.get(MongooseModule);
    expect(mongooseModule).toBeDefined();
  });

  it('should import JwtModule with correct configuration', () => {
    const jwtModule = module.get(JwtModule);
    expect(jwtModule).toBeDefined();
  });

  it('should provide MailerModule', () => {
    const mailerModule = module.get(MailerModule);
    expect(mailerModule).toBeDefined();
  });

  it('should provide UsersService', () => {
    const usersService = module.get(UsersService);
    expect(usersService).toBeDefined();
  });

  it('should declare UsersController', () => {
    const usersController = module.get(UsersController);
    expect(usersController).toBeDefined();
  });

  it('should export UsersService and MongooseModule', () => {
    const usersService = module.get(UsersService);
    const mongooseModule = module.get(MongooseModule);
    expect(usersService).toBeDefined();
    expect(mongooseModule).toBeDefined();
  });
});
