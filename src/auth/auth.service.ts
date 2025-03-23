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
import { User, UserDocument } from '../users/infrastructure/database/user.schema';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { MailerService } from '../common/services/mailer.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { first_name, last_name, email, password, captchaToken } = registerDto;

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
  console.log('🧪 Is user instance of model:', user instanceof this.userModel);
  console.log('🆔 Pre-save _id value:', user._id);
    await user.save();

    const token = this.jwtService.sign({ email }, { expiresIn: '1h' });
    console.log('📧 Email User:', process.env.EMAIL_USER);
    console.log('🔐 Email Pass:', process.env.EMAIL_PASS);

    await this.mailerService.sendVerificationEmail(email, token);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
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
    const token = this.jwtService.sign(payload);
    return { access_token: token };
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
      }
    );

    return response.data.success && (!response.data.score || response.data.score > 0.5);
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
  
}
