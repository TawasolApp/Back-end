import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserSeeder {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async seedUsers(count: number): Promise<void> {
    const users: Partial<UserDocument>[] = [];

    // Define a fixed password for all users
    const plainPassword = 'TestPassword123';  // Set the password for testing
    const hashedPassword = await bcrypt.hash(plainPassword, 10);  // Hashing the fixed password

    for (let i = 0; i < count; i++) {
      users.push({
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,  // Use the fixed hashed password
        role: faker.helpers.arrayElement(['customer', 'employer', 'admin']),
      });
    }

    await this.userModel.insertMany(users);
    console.log(`${count} users seeded successfully with a fixed password!`);
  }

  async clearUsers(): Promise<void> {
    await this.userModel.deleteMany({});
    console.log('Users collection cleared.');
  }
}
