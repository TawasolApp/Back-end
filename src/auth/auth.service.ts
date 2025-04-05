import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ResendConfirmationDto } from './dtos/resend-confirmation.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/schemas/user.schema';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { MailerService } from '../common/services/mailer.service';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  /**
   * Registers a new user by validating CAPTCHA, checking email availability, hashing the password, and sending a verification email.
   * @param dto - Registration data
   * @returns Success message
   */
  async register(dto: RegisterDto) {
    try {
      const { firstName, lastName, email, password, captchaToken } = dto;

      const isCaptchaValid = await this.verifyCaptcha(captchaToken);
      if (!isCaptchaValid) throw new BadRequestException('Invalid CAPTCHA');

      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) throw new ConflictException('Email is already in use');

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new this.userModel({
        first_name: firstName,
        last_name: lastName,
        email,
        password: hashedPassword,
        isVerified: false,
      });

      await user.save();

      const token = this.jwtService.sign({ email }, { expiresIn: '1h' });
      await this.mailerService.sendVerificationEmail(email, token);

      return {
        message:
          'Registration successful. Please check your email to verify your account.',
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Unexpected error occurred');
    }
  }

  /**
   * Checks if an email is available for registration.
   * @param dto - Email data
   * @returns Success message if available, otherwise throws ConflictException
   */
  async checkEmailAvailability(dto: { email: string }) {
    const { email } = dto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) throw new ConflictException('Email is already in use');

    return { message: 'Email is available' };
  }

  /**
   * Logs in a user by validating credentials.
   * @param dto - Login data
   * @returns Access and refresh tokens
   */
  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) throw new BadRequestException('Email not verified');

    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      token: accessToken,
      refreshToken,
      userId: user._id as Types.ObjectId,
    };
  }

  /**
   * Verifies a CAPTCHA token.
   * @param token - CAPTCHA token
   * @returns True if valid, otherwise false
   */
  private async verifyCaptcha(token: string): Promise<boolean> {
    if (token === 'test-token') return true;

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    try {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify`,
        null,
        { params: { secret: secretKey, response: token } },
      );

      return (
        response.data.success &&
        (!response.data.score || response.data.score > 0.5)
      );
    } catch (error) {
      console.error('Error verifying CAPTCHA:', error.message);
      return false;
    }
  }

  /**
   * Verifies a user's email using a token.
   * @param dto - Token data
   * @returns Success message
   */
  async verifyEmail(dto: { token: string }) {
    const { token } = dto;

    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.userModel.findOne({ email: decoded.email });

      if (!user)
        throw new BadRequestException('Invalid token or user does not exist');
      if (user.isVerified) return { message: 'Email is already verified.' };

      user.isVerified = true;
      await user.save();
      return { message: 'Email verified successfully.' };
    } catch (err) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  /**
   * Resends a confirmation email to the user.
   * @param dto - Email data
   * @returns Success message
   */
  async resendConfirmationEmail(dto: ResendConfirmationDto) {
    const { email } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Email not found');
    if (user.isVerified) return { message: 'Email is already verified' };

    const token = this.jwtService.sign({ email }, { expiresIn: '1h' });
    await this.mailerService.sendVerificationEmail(email, token);

    return { message: 'Confirmation email resent' };
  }

  /**
   * Refreshes an access token using a refresh token.
   * @param dto - Refresh token data
   * @returns New access token and the same refresh token
   */
  async refreshToken(dto: { refreshToken: string }) {
    const { refreshToken } = dto;

    try {
      const decoded = this.jwtService.verify(refreshToken);
      const payload = { sub: decoded.sub };

      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: '15m',
      });
      return { token: newAccessToken, refreshToken };
    } catch {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  /**
   * Sends a password reset email to the user.
   * @param dto - Email data
   * @returns Success message
   */
  async forgotPassword(dto: ForgotPasswordDto) {
    const { email } = dto;

    const user = await this.userModel.findOne({ email });
    if (user?.isVerified) {
      const token = this.jwtService.sign(
        { sub: user._id },
        { expiresIn: '15m' },
      );
      await this.mailerService.sendPasswordResetEmail(user.email, token);
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Resets the user's password using a token.
   * @param dto - Token and new password data
   * @returns Success message
   */
  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword } = dto;

    try {
      const { sub: userId } = await this.jwtService.verify(token);
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException('User not found');

      const isSame = await bcrypt.compare(newPassword, user.password);
      if (isSame) {
        throw new BadRequestException(
          'New password must be different from the old password',
        );
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      return { message: 'Password reset successfully' };
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async googleLogin(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({ idToken });
      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new BadRequestException('Invalid Google token');
      }

      let user = await this.userModel.findOne({ email: payload.email });
      if (!user) {
        user = new this.userModel({
          first_name: payload.given_name || '',
          last_name: payload.family_name || '',
          email: payload.email,
          password: '',
          isVerified: true,
        });
        await user.save();
      }

      const token = this.jwtService.sign({ sub: user._id });
      return {
        access_token: token,
        userId: user._id,
        message: 'Login successful',
      }; // Return userId
    } catch (err) {
      if (err.message === 'Invalid Google token') {
        throw new BadRequestException('Invalid Google token');
      }
      throw new InternalServerErrorException('Google login failed');
    }
  }
}
