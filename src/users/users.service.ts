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
import { Application } from '../jobs/infrastructure/database/schemas/application.schema';
import { CompanyEmployer } from '../jobs/infrastructure/database/schemas/company-employer.schema';
import { CompanyManager } from '../companies/infrastructure/database/schemas/company-manager.schema';
import { Job } from '../jobs/infrastructure/database/schemas/job.schema';

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
    @InjectModel(CompanyEmployer.name)
    private companyEmployerModel: Model<CompanyEmployer>,
    @InjectModel(CompanyManager.name)
    private companyManagerModel: Model<CompanyManager>,
    @InjectModel(Application.name)
    private applicationModel: Model<Application>,
    @InjectModel(Job.name) private jobModel: Model<Job>,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  async requestEmailUpdate(userId: string, dto: UpdateEmailRequestDto) {
    const { newEmail, password } = dto;

    try {
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException('User not found');

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new BadRequestException('Incorrect password');
      }

      const emailExists = await this.userModel.findOne({ email: newEmail });
      if (emailExists) {
        throw new ConflictException('Email already exists');
      }

      const token = this.jwtService.sign(
        { userId, newEmail },
        { expiresIn: '1h' },
      );
      await this.mailerService.sendEmailChangeConfirmation(newEmail, token);

      return { message: 'Please check your new email to confirm the change.' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
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
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException('Invalid or expired token');
    }
  }

  async updatePassword(userId: string, updatePasswordDto: UpdatePasswordDto) {
    const { currentPassword, newPassword } = updatePasswordDto;

    try {
      const user = await this.userModel.findById(new Types.ObjectId(userId));
      if (!user) throw new NotFoundException('User not found');

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Incorrect current password');
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        throw new BadRequestException(
          'New password must be different from the current password',
        );
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.is_social_login = false; // Changed from isSocialLogin to is_social_login
      await user.save();

      return { message: 'Password updated successfully' };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
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

  async deleteAccount(userId: string) {
    try {
      const objectId = new Types.ObjectId(userId);
      console.log(`Starting account deletion for user: ${userId}`);

      const user = await this.userModel.findById(objectId);
      if (!user) {
        console.error(`User not found: ${userId}`);
        throw new NotFoundException('User not found');
      }

      console.log(`Deleting profile for user: ${userId}`);
      await this.profileModel.deleteOne({ _id: objectId });

      console.log(`Deleting posts for user: ${userId}`);
      await this.postModel.deleteMany({ author_id: objectId });

      console.log(`Deleting saved posts for user: ${userId}`);
      await this.saveModel.deleteMany({ user_id: objectId });

      console.log(`Processing reacts for user: ${userId}`);
      const userReacts = await this.reactModel.find({ user_id: objectId });
      for (const react of userReacts) {
        if (react.post_type === 'Post') {
          console.log(`Updating react count for post: ${react.post_id}`);
          await this.postModel.updateOne(
            { _id: react.post_id },
            { $inc: { [`react_count.${react.react_type}`]: -1 } },
          );
        } else if (react.post_type === 'Comment') {
          console.log(`Updating react count for comment: ${react.post_id}`);
          await this.commentModel.updateOne(
            { _id: react.post_id },
            { $inc: { [`react_count.${react.react_type}`]: -1 } },
          );
        }
      }
      await this.reactModel.deleteMany({ user_id: objectId });

      console.log(`Processing comments for user: ${userId}`);
      const userComments = await this.commentModel.find({
        author_id: objectId,
      });
      for (const comment of userComments) {
        console.log(`Deleting replies for comment: ${comment._id}`);
        await this.commentModel.deleteMany({ _id: { $in: comment.replies } });

        console.log(`Updating comment count for post: ${comment.post_id}`);
        await this.postModel.updateOne(
          { _id: comment.post_id },
          { $inc: { comment_count: -1 } },
        );
      }
      await this.commentModel.deleteMany({ author_id: objectId });

      console.log(`Processing reposts for user: ${userId}`);
      const userReposts = await this.postModel.find({
        author_id: objectId,
        parent_post_id: { $ne: null },
      });
      for (const repost of userReposts) {
        console.log(
          `Updating share count for parent post: ${repost.parent_post_id}`,
        );
        await this.postModel.updateOne(
          { _id: repost.parent_post_id },
          { $inc: { share_count: -1 } },
        );
      }
      await this.postModel.deleteMany({
        author_id: objectId,
        parent_post_id: { $ne: null },
      });

      console.log(`Deleting shares for user: ${userId}`);
      await this.shareModel.deleteMany({ user: objectId });

      console.log(`Deleting user connections for user: ${userId}`);
      await this.userConnectionModel.deleteMany({
        $or: [{ sending_party: objectId }, { receiving_party: objectId }],
      });

      console.log(`Deleting company connections for user: ${userId}`);
      await this.companyConnectionModel.deleteMany({ user_id: objectId });

      console.log(`Deleting company employer records for user: ${userId}`);
      await this.companyEmployerModel.deleteMany({ employer_id: objectId });

      console.log(`Deleting company manager records for user: ${userId}`);
      await this.companyManagerModel.deleteMany({ manager_id: objectId });

      console.log(`Processing job applications for user: ${userId}`);
      const userApplications = await this.applicationModel.find({
        user_id: objectId,
      });
      for (const application of userApplications) {
        console.log(`Updating applicant count for job: ${application.job_id}`);
        await this.jobModel.updateOne(
          { _id: application.job_id },
          { $inc: { applicants: -1 } },
        );
      }
      await this.applicationModel.deleteMany({ user_id: objectId });

      console.log(`Deleting user record for user: ${userId}`);
      await this.userModel.deleteOne({ _id: objectId });

      console.log(
        `Account deletion completed successfully for user: ${userId}`,
      );
      return { message: 'Account and all related data deleted successfully.' };
    } catch (error) {
      console.error(`Error during account deletion for user: ${userId}`, error);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Failed to delete account. Please try again later.',
      );
    }
  }
}
