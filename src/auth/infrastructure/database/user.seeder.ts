import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { faker } from '@faker-js/faker';

@Injectable()
export class UserSeeder {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async seedUsers(count: number): Promise<void> {
    const users: Partial<UserDocument>[] = [];

    for (let i = 0; i < count; i++) {
      users.push({
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: faker.internet.password(),
        role: faker.helpers.arrayElement(['customer', 'employer', 'admin']),
      });
    }

    await this.userModel.insertMany(users);
    console.log(`${count} users seeded successfully!`);
  }

  async clearUsers(): Promise<void> {
    await this.userModel.deleteMany({});
    console.log('Users collection cleared.');
  }
}
