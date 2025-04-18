import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import {
  Conversation,
  ConversationDocument,
} from '../schemas/conversation.schema';
import {
  Profile,
  ProfileDocument,
} from '../../../../profiles/infrastructure/database/schemas/profile.schema';

@Injectable()
export class ConversationSeeder {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  async seedConversations(count: number): Promise<void> {
    const profiles = await this.profileModel.find().select('_id').lean();

    if (profiles.length < 2) {
      console.log('Not enough users to create conversations.');
      return;
    }

    const existingConversations = await this.conversationModel
      .find()
      .select('participants')
      .lean();

    const existingSet = new Set(
      existingConversations.flatMap((c) => [
        `${c.participants[0]}-${c.participants[1]}`,
        `${c.participants[1]}-${c.participants[0]}`,
      ]),
    );

    const conversations: Partial<Conversation>[] = [];

    for (let i = 0; i < count; i++) {
      let firstParticipant, secondParticipant, keyFirSec, keySecFir;

      do {
        firstParticipant = faker.helpers.arrayElement(profiles);
        secondParticipant = faker.helpers.arrayElement(profiles);
        keyFirSec = `${firstParticipant._id}-${secondParticipant._id}`;
        keySecFir = `${secondParticipant._id}-${firstParticipant._id}`;
      } while (
        firstParticipant._id.equals(secondParticipant._id) ||
        existingSet.has(keyFirSec) ||
        existingSet.has(keySecFir)
      );

      existingSet.add(keyFirSec);
      existingSet.add(keySecFir);

      conversations.push({
        participants: [firstParticipant._id, secondParticipant._id],
        unseen_count: faker.number.int({ min: 0, max: 10 }),
      });
    }

    await this.conversationModel.insertMany(conversations);
    console.log(`${conversations.length} conversations seeded successfully!`);
  }

  async clearConversations(): Promise<void> {
    await this.conversationModel.deleteMany({});
    console.log('Conversations collection cleared.');
  }
}
