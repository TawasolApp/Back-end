import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import { Message, MessageDocument } from '../schemas/message.schema';
import { Conversation } from '../schemas/conversation.schema';
import {
  Profile,
  ProfileDocument,
} from '../../../../profiles/infrastructure/database/schemas/profile.schema';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/schemas/user.schema';
import { MessageStatus } from '../../../enums/message-status.enum';

@Injectable()
export class MessageSeeder {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
  ) {}

  async seedMessages(count: number): Promise<void> {
    const profiles = await this.profileModel.find().select('_id').lean();
    const users = await this.userModel.find().select('_id created_at').lean();
    const conversations = await this.conversationModel
      .find()
      .select('_id participants')
      .lean();

    if (!conversations.length || !profiles.length) {
      console.log('No conversations or users found. Aborting message seeding.');
      return;
    }

    const userCreatedAtMap = new Map<string, Date>();
    users.forEach((user) => {
      userCreatedAtMap.set(user._id.toString(), new Date(user.created_at));
    });

    const messages: Partial<MessageDocument>[] = [];

    for (let i = 0; i < count; i++) {
      const conversation = faker.helpers.arrayElement(conversations);
      const sender = faker.helpers.arrayElement(conversation.participants);

      const user1CreatedAt = userCreatedAtMap.get(
        conversation.participants[0]._id.toString(),
      )!;
      const user2CreatedAt = userCreatedAtMap.get(
        conversation.participants[1]._id.toString(),
      )!;
      const minDate =
        user1CreatedAt > user2CreatedAt ? user1CreatedAt : user2CreatedAt;
      const sentAt = faker.date.between({
        from: minDate,
        to: new Date('2025-04-10'),
      });

      messages.push({
        sender_id: sender,
        conversation_id: conversation._id,
        text: faker.lorem.sentence(),
        media: faker.datatype.boolean()
          ? Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
              faker.image.url(),
            )
          : [],
        status: faker.helpers.arrayElement(Object.values(MessageStatus)),
        sent_at: sentAt,
      });
    }

    await this.messageModel.insertMany(messages);
    console.log(`${messages.length} messages seeded successfully!`);
  }

  async clearMessages(): Promise<void> {
    await this.messageModel.deleteMany({});
    console.log('Messages collection cleared.');
  }
}
