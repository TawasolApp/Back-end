import { forwardRef, Module, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { APP_PIPE } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import {
  Notification,
  NotificationSchema,
} from './infrastructure/database/schemas/notification.schema';
import { NotificationSeeder } from './infrastructure/database/seeders/notification.seeders';
import {
  Post,
  PostSchema,
} from '../posts/infrastructure/database/schemas/post.schema';
import {
  React,
  ReactSchema,
} from '../posts/infrastructure/database/schemas/react.schema';
import {
  Comment,
  CommentSchema,
} from '../posts/infrastructure/database/schemas/comment.schema';
import {
  UserConnection,
  UserConnectionSchema,
} from '../connections/infrastructure/database/schemas/user-connection.schema';
import {
  Conversation,
  ConversationSchema,
} from '../messages/infrastructure/database/schemas/conversation.schema';
import {
  Message,
  MessageSchema,
} from '../messages/infrastructure/database/schemas/message.schema';
import {
  User,
  UserSchema,
} from '../users/infrastructure/database/schemas/user.schema';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import {
  Company,
  CompanySchema,
} from '../companies/infrastructure/database/schemas/company.schema';
import { CompaniesModule } from '../companies/companies.module';
import { NotificationGateway } from '../gateway/notification.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: React.name, schema: ReactSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: UserConnection.name, schema: UserConnectionSchema },
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
    ]),
    AuthModule,
    UsersModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
    CompaniesModule,
  ],
  controllers: [NotificationsController],
  exports: [MongooseModule, NotificationSeeder],
  providers: [
    NotificationSeeder,
    NotificationsService,
    NotificationGateway,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class NotificationsModule {}
