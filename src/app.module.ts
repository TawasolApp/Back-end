import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ConnectionsModule } from './connections/connections.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CompaniesModule } from './companies/companies.module';
import { JobsModule } from './jobs/jobs.module';
import { PostsModule } from './posts/posts.module';
import { SecurityModule } from './security/security.module';
import { AdminModule } from './admin/admin.module';
import { PaymentsModule } from './payments/payments.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from './users/users.module';
import { MediaModule } from './common/media/media.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || ''),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    ProfilesModule,
    ConnectionsModule,
    MessagesModule,
    NotificationsModule,
    CompaniesModule,
    JobsModule,
    PostsModule,
    SecurityModule,
    AdminModule,
    PaymentsModule,
    UsersModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
