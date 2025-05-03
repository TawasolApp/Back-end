import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MailerModule } from '../common/services/mailer.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
} from '../users/infrastructure/database/schemas/user.schema';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    MailerModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
