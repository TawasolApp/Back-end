import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
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
    const { first_name, last_name, email, password, captchaToken } =
      registerDto;

    const isCaptchaValid = await this.verifyCaptcha(captchaToken);
    if (!isCaptchaValid) {
      throw new BadRequestException('Invalid CAPTCHA');
    }

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      first_name,
      last_name,
      email,
      password: hashedPassword,
      isVerified: false,
    });
    // 👇 ADD THIS
    console.log(
      '🧪 Is user instance of model:',
      user instanceof this.userModel,
    );
    console.log('🆔 Pre-save _id value:', user._id);
    await user.save();

    const token = this.jwtService.sign({ email }, { expiresIn: '1h' });
    console.log('📧 Email User:', process.env.EMAIL_USER);
    console.log('🔐 Email Pass:', process.env.EMAIL_PASS);

    await this.mailerService.sendVerificationEmail(email, token);

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(email: string, password: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Email not verified');
    }

    const payload = { sub: user._id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    return {
      token: accessToken,
      refreshToken,
    };
  }

  async googleLogin(idToken: string) {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      // audience: not provided for now
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new BadRequestException('Invalid Google token');
    }

    const email = payload.email;
    const firstName = payload.given_name;
    const lastName = payload.family_name;

    let user = await this.userModel.findOne({ email });

    if (!user) {
      user = new this.userModel({
        first_name: firstName || '',
        last_name: lastName || '',
        email,
        password: '',
        isVerified: true,
      });
      await user.save();
    }

    const token = this.jwtService.sign({ sub: user._id });

    return {
      access_token: token,
      message: 'Login successful',
    };
  }

  private async verifyCaptcha(token: string): Promise<boolean> {
    // Allow test token for local testing (Postman etc.)
    if (token === 'test-token') return true;

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: secretKey,
          response: token,
        },
      },
    );

    return (
      response.data.success &&
      (!response.data.score || response.data.score > 0.5)
    );
  }

  async verifyEmail(token: string): Promise<string> {
    try {
      const decoded = this.jwtService.verify(token);
      const email = decoded.email;

      const user = await this.userModel.findOne({ email });

      if (!user) {
        throw new BadRequestException('Invalid token or user does not exist');
      }

      if (user.isVerified) {
        return 'Email is already verified.';
      }

      user.isVerified = true;
      await user.save();

      return 'Email verified successfully.';
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async resendConfirmationEmail(email: string): Promise<string> {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('Email not found');
    }

    if (user.isVerified) {
      return 'Email is already verified';
    }

    const token = this.jwtService.sign({ email }, { expiresIn: '1h' });
    await this.mailerService.sendVerificationEmail(email, token);

    return 'Confirmation email resent';
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken); // throws if invalid
      const payload = { sub: decoded.sub };

      const newAccessToken = this.jwtService.sign(payload, {
        expiresIn: '15m',
      });

      return {
        token: newAccessToken,
        refreshToken, // reuse or regenerate if you want
      };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new NotFoundException('Email not found');
    }

    if (!user.isVerified) {
      throw new BadRequestException('Email not verified');
    }

    const token = this.jwtService.sign({ sub: user._id }, { expiresIn: '15m' });

    await this.mailerService.sendPasswordResetEmail(user.email, token);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const { sub: userId } = await this.jwtService.verify(token);

      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException('User not found');

      const isSame = await bcrypt.compare(newPassword, user.password);
      if (isSame) {
        throw new BadRequestException(
          'New password cannot be the same as the old password',
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      await user.save();

      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }
}
