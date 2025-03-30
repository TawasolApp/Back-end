import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserConnection,
  UserConnectionDocument,
} from '../schemas/user-connection.schema';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/user.schema';
import { ConnectionStatus } from '../../../enums/connection-status.enum';
import { faker } from '@faker-js/faker';

@Injectable()
export class UserConnectionSeeder {
  constructor(
    @InjectModel(UserConnection.name)
    private userConnectionModel: Model<UserConnectionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedUserConnections(count: number): Promise<void> {
    const users = await this.userModel
      .find({ role: 'customer' })
      .select('_id')
      .lean();

    if (users.length < 2) {
      console.log('Not enough users to create connections. Seeding aborted.');
      return;
    }

    const existingConnections = await this.userConnectionModel
      .find()
      .select('sending_party receiving_party')
      .lean();

    const existingSet = new Set(
      existingConnections.flatMap((c) => [
        `${c.sending_party}-${c.receiving_party}`,
        `${c.receiving_party}-${c.sending_party}`,
      ]),
    );

    const userConnections: Partial<UserConnectionDocument>[] = [];

    for (let i = 0; i < count; i++) {
      let sendingUser, receivingUser, keySendRec, keyRecSend;

      do {
        sendingUser = faker.helpers.arrayElement(users);
        receivingUser = faker.helpers.arrayElement(users);
        keySendRec = `${sendingUser._id}-${receivingUser._id}`;
        keyRecSend = `${receivingUser._id}-${sendingUser._id}`;
      } while (
        sendingUser._id.equals(receivingUser._id) ||
        existingSet.has(keySendRec) ||
        existingSet.has(keyRecSend)
      );

      existingSet.add(keySendRec);
      existingSet.add(keyRecSend);
      userConnections.push({
        sending_party: sendingUser._id,
        receiving_party: receivingUser._id,
        status: faker.helpers.arrayElement([
          ConnectionStatus.Pending,
          ConnectionStatus.Connected,
          ConnectionStatus.Ignored,
          ConnectionStatus.Following,
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
