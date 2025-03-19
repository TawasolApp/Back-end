import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './infrastructure/database/user.schema';
import { UpdateEmailDto } from './dtos/update-email.dto';
import { Types } from 'mongoose';
@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async updateEmail(userId: string, updateEmailDto: UpdateEmailDto) {
    console.log("🔹 Email Update Request for User ID:", userId);
    
    const { newEmail } = updateEmailDto;
    const user = await this.userModel.findById(new Types.ObjectId(userId));

    if (!user) {
      console.log("❌ User not found for ID:", userId);
      throw new NotFoundException('User not found');
    }

    console.log("✅ User Found:", user.email);

    // 🔹 Ensure new email is not already in use
    const existingUser = await this.userModel.findOne({ email: newEmail });
    if (existingUser) {
      console.log("❌ Email already exists:", newEmail);
      throw new ConflictException('Email already exists');
    }

    // 🔹 Update email in the database
    user.email = newEmail;
    await user.save();

    console.log("✅ Email updated successfully:", newEmail);
    return { message: 'Email updated successfully' };
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }
}
