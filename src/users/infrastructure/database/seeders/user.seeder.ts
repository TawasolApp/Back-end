import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserSeeder {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async seedUsers(count: number): Promise<void> {
    const users: Partial<UserDocument>[] = [];

    const plainPassword = 'TestPassword123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    for (let i = 0; i < count; i++) {
      users.push({
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        role: faker.helpers.arrayElement(['customer', 'employer', 'admin']),
        isVerified: true,
      });
    }

    const inserted = await this.userModel.insertMany(users);
  

    inserted.forEach((user) => {
      console.log(`🆔 User ID: ${user._id} | 📧 Email: ${user.email}`);
    });
  }

  async clearUsers(): Promise<void> {
    await this.userModel.deleteMany({});
    console.log('🗑️ Users collection cleared.');
  }
}
