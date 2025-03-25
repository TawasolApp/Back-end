import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './infrastructure/database/user.schema';
import { UpdateEmailRequestDto } from './dtos/update-email-request.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MailerService } from '../common/services/mailer.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async requestEmailUpdate(userId: string, dto: UpdateEmailRequestDto) {
    const { newEmail, password } = dto;
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Incorrect password');
    }

    if (await this.userModel.findOne({ email: newEmail })) {
      throw new ConflictException('Email already exists');
    }

    const token = this.jwtService.sign(
      { userId, newEmail },
      { expiresIn: '1h' },
    );
    await this.mailerService.sendEmailChangeConfirmation(newEmail, token);

    return { message: 'Please check your new email to confirm the change.' };
  }

  async confirmEmailChange(token: string) {
    try {
      const { userId, newEmail } = this.jwtService.verify(token);
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException('User not found');

      user.email = newEmail;
      await user.save();

      return { message: 'Email updated successfully.' };
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword } = updatePasswordDto;
    const user = await this.userModel.findById(userId); // Removed Types.ObjectId conversion
    if (!user) throw new NotFoundException('User not found');

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new BadRequestException('Incorrect current password');
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return { message: 'Password updated successfully' };
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findOne({ email });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user by email');
    }
  }
}

