import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './infrastructure/database/user.schema';
import { UpdateEmailRequestDto } from './dtos/update-email-request.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import * as bcrypt from 'bcrypt';
import { MailerService } from '../common/services/mailer.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Handles a user's request to update their email.
   * Validates the user's password, checks if the new email is available, and sends a confirmation email.
   * @param userId - The ID of the user requesting the email update
   * @param dto - The email update request data
   * @returns A success message
   */
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

  /**
   * Confirms a user's email change using a token.
   * Updates the user's email if the token is valid.
   * @param token - The email change confirmation token
   * @returns A success message
   */
  async confirmEmailChange(token: string) {
    try {
      const { userId, newEmail } = this.jwtService.verify(token);
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException('User not found');

      user.email = newEmail;
      await user.save();

      return { message: 'Email updated successfully.' };
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new BadRequestException('Invalid or expired token');
    }
  }

  /**
   * Updates a user's password.
   * Validates the current password and ensures the new password is different.
   * @param userId - The ID of the user updating their password
   * @param dto - The password update data
   * @returns A success message
   */
  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const { currentPassword, newPassword } = dto;
    const user = await this.userModel.findById(new Types.ObjectId(userId));
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

  /**
   * Finds a user by their email address.
   * @param email - The email address to search for
   * @returns The user document if found, or null if not found
   */
  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findOne({ email });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user by email');
    }
  }
}
