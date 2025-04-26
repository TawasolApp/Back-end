import { forwardRef, Module, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { APP_PIPE } from '@nestjs/core';
import {
  Conversation,
  ConversationSchema,
} from './infrastructure/database/schemas/conversation.schema';
import {
  Message,
  MessageSchema,
} from './infrastructure/database/schemas/message.schema';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { ConversationSeeder } from './infrastructure/database/seeders/conversation.seeder';
import { MessageSeeder } from './infrastructure/database/seeders/message.seeder';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { MessagesGateway } from '../gateway/messages.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    AuthModule,
    UsersModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [MongooseModule, ConversationSeeder, MessageSeeder],
  providers: [
    ConversationSeeder,
    MessageSeeder,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    MessagesService,
    MessagesGateway,
  ],
  controllers: [MessagesController],
})
export class MessagesModule {}
