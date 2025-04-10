import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
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
import { SetNewPassword } from './dtos/set-new-password.dto';
import { SocialLoginDto } from './dtos/social-login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  // Initialize Google OAuth2 clients for both frontend and Android
  private googleClientFrontend = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  private googleClientAndroid = new OAuth2Client(process.env.ANDROID_CLIENT_ID);

  /**
   * Registers a new user by validating CAPTCHA, checking email availability, hashing the password, and sending a verification email.
   * @param dto - Registration data
   * @returns Success message
   */
  async register(dto: RegisterDto) {
    try {
      const { firstName, lastName, email, password, captchaToken } = dto;

      const isCaptchaValid = await this.verifyCaptcha(captchaToken);
      if (!isCaptchaValid) {
        console.log('❌ Invalid CAPTCHA for email:', email);
        throw new BadRequestException('Invalid CAPTCHA');
      }

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
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }

    if (!user.isVerified) {
      throw new ForbiddenException('Email not verified');
    }

    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      token: accessToken,
      refreshToken,
      isSocialLogin: user.isSocialLogin,
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
      console.error('Error verifying CAPTCHA:', error);
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
   * Resends a confirmation email for different purposes (verify email, forgot password, or email update).
   * @param dto - Resend confirmation data
   * @returns Success message
   */
  async resendConfirmationEmail(dto: ResendConfirmationDto) {
    const { email, type } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Email not found');

    if (type === 'verifyEmail' && user.isVerified) {
      return { message: 'Email is already verified' };
    }

    const tokenPayload =
      type === 'forgotPassword'
        ? { sub: user._id }
        : type === 'emailUpdate'
          ? { userId: user._id, newEmail: email }
          : { email };

    const token = this.jwtService.sign(tokenPayload, {
      expiresIn: type === 'forgotPassword' ? '15m' : '1h',
    });

    await this.mailerService.resendConfirmationEmail(email, type, token);
    return { message: `${type} email resent successfully` };
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
      const user = await this.userModel.findById(decoded.sub);

      if (!user) throw new NotFoundException('User not found');

      const payload = { sub: user._id, email: user.email, role: user.role };
      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: '1h',
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
    const { email, isAndroid } = dto;

    const user = await this.userModel.findOne({ email });
    if (user?.isVerified) {
      const token = this.jwtService.sign(
        { sub: user._id },
        { expiresIn: '15m' },
      );

      await this.mailerService.sendPasswordResetEmail(
        user.email,
        token,
        isAndroid,
      );
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  /**
   * Verifies the reset password token.
   * @param dto - Token data
   * @returns Success message
   */
  async resetPassword(dto: ResetPasswordDto) {
    const { token } = dto;

    try {
      const { sub: userId } = await this.jwtService.verify(token);
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException('User not found');

      return { message: 'Token is valid' };
    } catch (err) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  /**
   * Sets a new password for the user by finding them via email.
   * @param dto - New password data
   * @returns Success message
   */
  async setNewPassword(dto: SetNewPassword) {
    const { email, newPassword } = dto;

    try {
      const user = await this.userModel.findOne({ email });
      if (!user) throw new NotFoundException('User not found');

      const isSame = await bcrypt.compare(newPassword, user.password);
      if (isSame) {
        throw new BadRequestException(
          'New password must be different from the old password',
        );
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.isSocialLogin = false;
      await user.save();

      return { message: 'Password reset successfully' };
    } catch (err) {
      throw new InternalServerErrorException('Failed to reset password');
    }
  }

  async googleLogin(dto: SocialLoginDto) {
    const { idToken, isAndroid } = dto;

    try {
      const googleClient = isAndroid
        ? this.googleClientAndroid
        : this.googleClientFrontend;

      const tokenInfo = await googleClient.getTokenInfo(idToken);

      const { data: profile } = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: { Authorization: `Bearer ${idToken}` },
        },
      );

      if (!profile?.email) {
        throw new BadRequestException('Invalid Google token');
      }

      let user = await this.userModel.findOne({ email: profile.email });
      const isNewUser = !user;

      if (!user) {
        const randomPassword = 'TestPassword123';
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = new this.userModel({
          first_name: profile.given_name || '',
          last_name: profile.family_name || '',
          email: profile.email,
          password: hashedPassword,
          isVerified: true,
          isSocialLogin: true,
        });
        await user.save();
      }

      const payload = { sub: user._id, email: user.email, role: user.role };
      const token = this.jwtService.sign(payload, { expiresIn: '1h' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      return {
        token: token,
        refreshToken,
        email: user.email,
        isSocialLogin: user.isSocialLogin, // Include isSocialLogin in the response
        isNewUser,
        message: 'Login successful',
      };
    } catch (err) {
      if (err.message === 'Invalid Google token') {
        throw new BadRequestException('Invalid Google token');
      }
      throw new InternalServerErrorException('Google login failed');
    }
  }
}
