import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/infrastructure/database/user.schema';
import { UpdateEmailDto } from './dtos/update-email.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async updateEmail(userId: string, updateEmailDto: UpdateEmailDto) {
    const { newEmail } = updateEmailDto;
  
    // Check if the email already exists
    const existingUser = await this.userModel.findOne({ email: newEmail }).exec();
    if (existingUser) {
      console.log('❌ Email already in use:', newEmail);
      throw new ConflictException('Email is already in use');
    }
  
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      console.log('❌ User not found for ID:', userId);
      throw new NotFoundException('User not found');
    }
    
    // Print the old and new email
    console.log('🟢 Updating email from', user.email, 'to', newEmail);
  
    user.email = newEmail;
    await user.save();
  
    return { message: 'Email updated successfully' };
  }
  
}
