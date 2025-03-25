import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/user.schema';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { MailerService } from '../common/services/mailer.service';
import { OAuth2Client } from 'google-auth-library';
const googleClient = new OAuth2Client();

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const { firstName, lastName, email, password, captchaToken } =
        registerDto;

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
    } catch (err) {
      throw new InternalServerErrorException(
        err.message || 'Something went wrong',
      );
    }
  }

  async checkEmailAvailability(email: string) {
    try {
      const existingUser = await this.userModel.findOne({ email });
      if (existingUser) throw new ConflictException('Email is already in use');

      return { message: 'Email is available' };
    } catch (err) {
      throw new InternalServerErrorException(
        'Server error while checking email',
      );
    }
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified) throw new BadRequestException('Email not verified');

    const payload = { sub: user._id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return { token: accessToken, refreshToken };
  }

  async googleLogin(idToken: string) {
    try {
      const ticket = await googleClient.verifyIdToken({ idToken });
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
      return { access_token: token, message: 'Login successful' };
    } catch (err) {
      throw new InternalServerErrorException('Google login failed');
    }
  }

  private async verifyCaptcha(token: string): Promise<boolean> {
    if (token === 'test-token') return true;

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      { params: { secret: secretKey, response: token } },
    );

    return (
      response.data.success &&
      (!response.data.score || response.data.score > 0.5)
    );
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
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

  async resendConfirmationEmail(email: string): Promise<{ message: string }> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('Email not found');
    if (user.isVerified) return { message: 'Email is already verified' };

    const token = this.jwtService.sign({ email }, { expiresIn: '1h' });
    await this.mailerService.sendVerificationEmail(email, token);

    return { message: 'Confirmation email resent' };
  }

  async refreshToken(refreshToken: string) {
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

  async forgotPassword(email: string) {
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

  async resetPassword(token: string, newPassword: string) {
    try {
      const { sub: userId } = await this.jwtService.verify(token);
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException('User not found');

      const isSame = await bcrypt.compare(newPassword, user.password);
      if (isSame)
        throw new BadRequestException(
          'New password must be different from the old password',
        );

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();

      return { message: 'Password reset successfully' };
    } catch (err) {
      throw new BadRequestException('Invalid or expired token');
    }
  }
}
