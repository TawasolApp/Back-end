import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './infrastructure/database/user.schema';
import { UpdateEmailRequestDto } from './dtos/update-email-request.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../common/services/mailer.service';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService, // ✅ Add this
    private readonly mailerService: MailerService,
  ) {}

  async requestEmailUpdate(userId: string, dto: UpdateEmailRequestDto) {
    const { newEmail, password } = dto;
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new BadRequestException('Incorrect password');

    const emailTaken = await this.userModel.findOne({ email: newEmail });
    if (emailTaken) throw new ConflictException('Email already exists');

    const token = this.jwtService.sign(
      { userId, newEmail },
      { expiresIn: '1h' },
    );
    console.log('JWT_SECRET used update:', process.env.JWT_SECRET);

    await this.mailerService.sendEmailChangeConfirmation(newEmail, token);

    return { message: 'Please check your new email to confirm the change.' };
  }

  async confirmEmailChange(token: string) {
    try {
      const { userId, newEmail } = this.jwtService.verify(token);
      console.log('JWT_SECRET used confirm:', process.env.JWT_SECRET);

      const user = await this.userModel.findById(userId);

      if (!user) throw new NotFoundException('User not found');

      user.email = newEmail;
      await user.save();

      return { message: 'Email updated successfully.' };
    } catch (err) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    console.log('🔹 Password Update Request for User ID:', userId);

    const { currentPassword, newPassword } = updatePasswordDto;
    const user = await this.userModel.findById(new Types.ObjectId(userId));

    if (!user) {
      console.log('❌ User not found for ID:', userId);
      throw new NotFoundException('User not found');
    }

    console.log('✅ User Found:', user.email);

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      console.log('❌ Incorrect current password');
      throw new BadRequestException('Incorrect current password');
    }

    // 🔹 Check if the new password is the same as the current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      console.log('❌ New password cannot be the same as the current password');
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    console.log('✅ Password updated successfully');
    return { message: 'Password updated successfully' };
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }
}
