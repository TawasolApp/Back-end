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
import {
  User,
  UserDocument,
} from './infrastructure/database/schemas/user.schema';
import { UpdateEmailRequestDto } from './dtos/update-email-request.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { MailerService } from '../common/services/mailer.service';
import { Post } from '../posts/infrastructure/database/schemas/post.schema';
import { Save } from '../posts/infrastructure/database/schemas/save.schema';
import { React } from '../posts/infrastructure/database/schemas/react.schema';
import { Comment } from '../posts/infrastructure/database/schemas/comment.schema';
import { Share } from '../posts/infrastructure/database/schemas/share.schema';
import { Profile } from '../profiles/infrastructure/database/schemas/profile.schema';
import { UserConnection } from '../connections/infrastructure/database/schemas/user-connection.schema';
import { CompanyConnection } from '../companies/infrastructure/database/schemas/company-connection.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Save.name) private saveModel: Model<Save>,
    @InjectModel(React.name) private reactModel: Model<React>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Share.name) private shareModel: Model<Share>,
    @InjectModel(UserConnection.name)
    private userConnectionModel: Model<UserConnection>,
    @InjectModel(CompanyConnection.name)
    private companyConnectionModel: Model<CompanyConnection>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async requestEmailUpdate(userId: string, dto: UpdateEmailRequestDto) {
    try {
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
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to process email update request',
      );
    }
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
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    try {
      const { currentPassword, newPassword } = updatePasswordDto;
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
    } catch (error) {
      throw new InternalServerErrorException('Failed to update password');
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    try {
      return await this.userModel.findOne({ email });
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch user by email');
    }
  }

  /**
   * Deletes a user and all related data.
   * @param userId - The ID of the user to delete
   * @returns A success message
   */
  async deleteAccount(userId: string) {
    const session = await this.userModel.db.startSession();
    session.startTransaction();

    try {
      await this.profileModel.deleteOne({ _id: userId }).session(session);

      await this.postModel.deleteMany({ author_id: userId }).session(session);

      await this.saveModel.deleteMany({ user_id: userId }).session(session);

      const userReacts = await this.reactModel
        .find({ user_id: userId })
        .session(session);
      for (const react of userReacts) {
        if (react.post_type === 'Post') {
          await this.postModel
            .updateOne(
              { _id: react.post_id },
              { $inc: { [`react_count.${react.react_type}`]: -1 } },
            )
            .session(session);
        } else if (react.post_type === 'Comment') {
          await this.commentModel
            .updateOne({ _id: react.post_id }, { $inc: { react_count: -1 } })
            .session(session);
        }
      }
      await this.reactModel.deleteMany({ user_id: userId }).session(session);

      const userComments = await this.commentModel
        .find({ author_id: userId })
        .session(session);
      for (const comment of userComments) {
        await this.postModel
          .updateOne({ _id: comment.post_id }, { $inc: { comment_count: -1 } })
          .session(session);
      }
      await this.commentModel
        .deleteMany({ author_id: userId })
        .session(session);

      const userShares = await this.shareModel
        .find({ user: userId })
        .session(session);
      for (const share of userShares) {
        await this.postModel
          .updateOne({ _id: share.post }, { $inc: { share_count: -1 } })
          .session(session);
      }
      await this.shareModel.deleteMany({ user: userId }).session(session);

      await this.userConnectionModel
        .deleteMany({
          $or: [{ sending_party: userId }, { receiving_party: userId }],
        })
        .session(session);

      await this.companyConnectionModel
        .deleteMany({ user_id: userId })
        .session(session);

      await this.userModel.deleteOne({ _id: userId }).session(session);

      await session.commitTransaction();
      return { message: 'Account and all related data deleted successfully.' };
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException('Failed to delete account');
    } finally {
      session.endSession();
    }
  }
}
