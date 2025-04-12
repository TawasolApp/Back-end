import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import {
  UserConnection,
  UserConnectionDocument,
} from '../schemas/user-connection.schema';
import {
  Profile,
  ProfileDocument,
} from '../../../../profiles/infrastructure/database/schemas/profile.schema';
import {
  User,
  UserDocument,
} from '../../../../users/infrastructure/database/schemas/user.schema';
import { ConnectionStatus } from '../../../enums/connection-status.enum';

@Injectable()
export class UserConnectionSeeder {
  constructor(
    @InjectModel(UserConnection.name)
    private userConnectionModel: Model<UserConnectionDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async seedUserConnections(count: number): Promise<void> {
    const profiles = await this.profileModel.find().select('_id').lean();
    const users = await this.userModel.find().select('_id created_at').lean();

    const userCreatedAtMap = new Map<string, Date>();
    users.forEach((user) => {
      userCreatedAtMap.set(user._id.toString(), new Date(user.created_at));
    });

    if (profiles.length < 2) {
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
        sendingUser = faker.helpers.arrayElement(profiles);
        receivingUser = faker.helpers.arrayElement(profiles);
        keySendRec = `${sendingUser._id}-${receivingUser._id}`;
        keyRecSend = `${receivingUser._id}-${sendingUser._id}`;
      } while (
        sendingUser._id.equals(receivingUser._id) ||
        existingSet.has(keySendRec) ||
        existingSet.has(keyRecSend)
      );

      const senderCreatedAt = userCreatedAtMap.get(sendingUser._id.toString());
      const receiverCreatedAt = userCreatedAtMap.get(
        receivingUser._id.toString(),
      );

      if (!senderCreatedAt || !receiverCreatedAt) continue;

      const minDate =
        senderCreatedAt > receiverCreatedAt
          ? senderCreatedAt
          : receiverCreatedAt;
      const connectionCreatedAt = faker.date.between({
        from: minDate,
        to: new Date('2025-04-10'),
      });

      existingSet.add(keySendRec);
      existingSet.add(keyRecSend);
      userConnections.push({
        sending_party: sendingUser._id,
        receiving_party: receivingUser._id,
        status: faker.helpers.arrayElement(
          Object.values(ConnectionStatus).filter(
            (status) => status !== ConnectionStatus.Blocked,
          ),
        ),
        created_at: connectionCreatedAt.toISOString(),
      });
    }

    await this.userConnectionModel.insertMany(userConnections);
    console.log(
      `${userConnections.length} user connections seeded successfully!`,
    );
  }

  async clearUserConnections(): Promise<void> {
    await this.userConnectionModel.deleteMany({});
    console.log('UserConnections collection cleared.');
  }
}
