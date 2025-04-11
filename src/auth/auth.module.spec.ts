import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MailerModule } from '../common/services/mailer.module';
import { User, UserSchema } from '../users/infrastructure/database/schemas/user.schema';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        // Mock the MongooseModule
        MongooseModule.forRoot('mongodb://localhost/test'),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        // Mock other required modules
        PassportModule,
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '60s' },
        }),
        UsersModule,
        MailerModule,
        // Your AuthModule
        AuthModule,
      ],
    })
    // Override any providers that need mocking
    .overrideProvider(getModelToken(User.name))
    .useValue({
      // Mock implementation of the User model methods you need
      findOne: jest.fn(),
      create: jest.fn(),
      // Add other methods as needed
    })
    .compile();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should import PassportModule', () => {
    const passportModule = module.get(PassportModule);
    expect(passportModule).toBeDefined();
  });

  it('should import UsersModule', () => {
    const usersModule = module.get(UsersModule);
    expect(usersModule).toBeDefined();
  });

  it('should import MailerModule', () => {
    const mailerModule = module.get(MailerModule);
    expect(mailerModule).toBeDefined();
  });

  it('should import MongooseModule with User schema', () => {
    const mongooseModule = module.get(MongooseModule);
    expect(mongooseModule).toBeDefined();
    
    // Verify User model is registered
    const userModel = module.get(getModelToken(User.name));
    expect(userModel).toBeDefined();
  });

  it('should configure JwtModule', () => {
    const jwtModule = module.get(JwtModule);
    expect(jwtModule).toBeDefined();
  });

  it('should provide AuthService', () => {
    const authService = module.get(AuthService);
    expect(authService).toBeDefined();
    expect(authService).toBeInstanceOf(AuthService);
  });

  it('should declare AuthController', () => {
    const authController = module.get(AuthController);
    expect(authController).toBeDefined();
    expect(authController).toBeInstanceOf(AuthController);
  });

  it('should export AuthService', () => {
    const exports = Reflect.getMetadata('exports', AuthModule);
    expect(exports).toContain(AuthService);
  });
});