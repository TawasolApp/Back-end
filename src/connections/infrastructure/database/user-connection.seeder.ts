import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserConnection,
  UserConnectionDocument,
} from './user-connection.schema';
import {
  User,
  UserDocument,
} from '../../../auth/infrastructure/database/user.schema';
import { faker } from '@faker-js/faker';

@Injectable()
export class UserConnectionSeeder {
  constructor(
    @InjectModel(UserConnection.name)
    private userConnectionModel: Model<UserConnectionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedUserConnections(count: number): Promise<void> {
    const users = await this.userModel.find().select('_id').lean();

    if (users.length < 2) {
      console.log('Not enough users to create connections. Seeding aborted.');
      return;
    }

    const userConnections: Partial<UserConnectionDocument>[] = [];

    for (let i = 0; i < count; i++) {
      let sendingUser, receivingUser;
      do {
        sendingUser = faker.helpers.arrayElement(users);
        receivingUser = faker.helpers.arrayElement(users);
      } while (sendingUser._id.equals(receivingUser._id));

      userConnections.push({
        sending_party: sendingUser._id,
        receiving_party: receivingUser._id,
        status: faker.helpers.arrayElement([
          'pending',
          'connected',
          'following',
          'blocked',
        ]),
      });
    }

    await this.userConnectionModel.insertMany(userConnections);
    console.log(`${count} user connections seeded successfully!`);
  }

  async clearUserConnections(): Promise<void> {
    await this.userConnectionModel.deleteMany({});
    console.log('UserConnections collection cleared.');
  }
}
