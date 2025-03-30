import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';
import { MailerModule } from '../common/services/mailer.module';
import { User, UserSchema } from './infrastructure/database/user.schema';
import { UserSeeder } from './infrastructure/database/user.seeder';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '1h' },
    }),
    MailerModule,
  ],
  providers: [UsersService, UserSeeder],
  controllers: [UsersController],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
