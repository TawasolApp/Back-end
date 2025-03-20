import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './infrastructure/database/user.schema';
import { UpdateEmailDto } from './dtos/update-email.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async updateEmail(userId: string, updateEmailDto: UpdateEmailDto) {
    console.log("🔹 Email Update Request for User ID:", userId);
    
    const { newEmail, password } = updateEmailDto;
    const user = await this.userModel.findById(new Types.ObjectId(userId));

    if (!user) {
      console.log("❌ User not found for ID:", userId);
      throw new NotFoundException('User not found');
    }

    console.log("✅ User Found:", user.email);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("❌ Incorrect password");
      throw new BadRequestException('Incorrect password');
    }

    const existingUser = await this.userModel.findOne({ email: newEmail });
    if (existingUser) {
      console.log("❌ Email already exists:", newEmail);
      throw new ConflictException('Email already exists');
    }

    user.email = newEmail;
    await user.save();

    console.log("✅ Email updated successfully:", newEmail);
    return { message: 'Email updated successfully' };
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    console.log("🔹 Password Update Request for User ID:", userId);

    const { currentPassword, newPassword } = updatePasswordDto;
    const user = await this.userModel.findById(new Types.ObjectId(userId));

    if (!user) {
      console.log("❌ User not found for ID:", userId);
      throw new NotFoundException('User not found');
    }

    console.log("✅ User Found:", user.email);

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      console.log("❌ Incorrect current password");
      throw new BadRequestException('Incorrect current password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    console.log("✅ Password updated successfully");
    return { message: 'Password updated successfully' };
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }
}
