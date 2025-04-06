import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { Types } from 'mongoose';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { _ } from '@faker-js/faker/dist/airline-CBNP41sR';
import { CreateProfileDto } from './dto/create-profile.dto';
import { SkillDto } from './dto/skill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EducationDto } from './dto/education.dto';
import { ApiBody } from '@nestjs/swagger';
import { CertificationDto } from './dto/certification.dto';
import { WorkExperienceDto } from './dto/work-experience.dto';
import { PostsService } from 'src/posts/posts.service';
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfilesController {
  constructor(
    private profilesService: ProfilesService,
    private readonly postsService: PostsService, // Assuming you have a PostsService for handling posts
  ) {}

  /**
   * Handles exceptions and throws an InternalServerErrorException if not already an HTTP exception.
   * @param error - The error object
   * @param defaultMessage - The default error message
   */
  handleException(error: any, defaultMessage: string) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(defaultMessage);
  }
  /**
   * Creates a new user profile.
   * @param req - The request object containing the authenticated user
   * @param createProfileDto - The profile data transfer object
   */
  @Post()
  @UsePipes(new ValidationPipe())
  async createProfile(@Req() req, @Body() createProfileDto: CreateProfileDto) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.createProfile(
        req.user.sub,
        createProfileDto,
      );
    } catch (error) {
      this.handleException(error, 'Failed to create profile.');
    }
  }

  /**
   * Retrieves a user profile by ID.
   * @param id - The profile ID
   */
  @Get(':userId')
  @UsePipes(new ValidationPipe())
  async getProfile(@Req() req, @Param('userId') id: string) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid profile ID format');
      }
      return await this.profilesService.getProfile(new Types.ObjectId(id));
    } catch (error) {
      this.handleException(error, 'Failed to retrieve profile.');
    }
  }
  /**
   * Updates an existing user profile.
   * @param req - The request object containing the authenticated user
   * @param updateProfileDto - The profile update data transfer object
   */

  @Patch()
  @UsePipes(new ValidationPipe())
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.updateProfile(
        updateProfileDto,
        req.user.sub,
      );
    } catch (error) {
      this.handleException(error, 'Failed to update profile.');
    }
  }

  /**
   * Deletes the user's profile picture.
   * @param req - The request object containing the authenticated user
   */

  @Delete('profile-picture')
  @UsePipes(new ValidationPipe())
  async deleteProfilePicture(@Req() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      console.log('deleteProfilePicture controller: ' + req.user.sub);
      return await this.profilesService.deleteProfilePicture(req.user.sub);
    } catch (error) {
      this.handleException(error, `Failed to delete profile-picture.`);
    }
  }

  /**
   * Deletes the user's cover photo.
   * @param req - The request object containing the authenticated user
   */
  @Delete('cover-photo')
  @UsePipes(new ValidationPipe())
  async deleteCoverPhoto(@Req() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteCoverPhoto(req.user.sub);
    } catch (error) {
      this.handleException(error, `Failed to delete cover-photo.`);
    }
  }
  /**
   * Deletes the user's resume.
   * @param req - The request object containing the authenticated user
   */

  @Delete('resume')
  @UsePipes(new ValidationPipe())
  async deleteResume(@Req() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteResume(req.user.sub);
    } catch (error) {
      this.handleException(error, `Failed to delete resume.`);
    }
  }
  /**
   * Deletes the user's headline.
   * @param req - The request object containing the authenticated user
   */

  @Delete('headline')
  @UsePipes(new ValidationPipe())
  async deleteHeadline(@Req() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteHeadline(req.user.sub);
    } catch (error) {
      this.handleException(error, `Failed to delete headline.`);
    }
  }

  /**
   * Deletes the user's bio.
   * @param req - The request object containing the authenticated user
   */
  @Delete('bio')
  @UsePipes(new ValidationPipe())
  async deleteBio(@Req() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteBio(req.user.sub);
    } catch (error) {
      this.handleException(error, `Failed to delete bio.`);
    }
  }

  /**
   * Deletes the user's location.
   * @param req - The request object containing the authenticated user
   */
  @Delete('location')
  @UsePipes(new ValidationPipe())
  async deleteLocation(@Req() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteLocation(req.user.sub);
    } catch (error) {
      this.handleException(error, `Failed to delete location.`);
    }
  }

  /**
   * Deletes the user's industry.
   * @param req - The request object containing the authenticated user
   */
  @Delete('industry')
  @UsePipes(new ValidationPipe())
  async deleteIndustry(@Req() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteIndustry(req.user.sub);
    } catch (error) {
      this.handleException(error, `Failed to delete industry.`);
    }
  }

  /**
   * Adds a skill to the user's profile.
   * @param req - The request object containing the authenticated user
   * @param skill - The skill data transfer object
   */
  @Patch('skills')
  @UsePipes(new ValidationPipe())
  async addSkill(@Req() req, @Body() skill: SkillDto) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.addSkill(skill, req.user.sub);
    } catch (error) {
      this.handleException(error, 'Failed to add skill.');
    }
  }
  /**
   * Deletes a specific skill from the user's profile.
   * @param req - The request object containing the authenticated user
   * @param skillName - The name of the skill to be deleted
   */
  @Delete('skills/:skillName')
  @UsePipes(new ValidationPipe())
  async deleteSkill(@Req() req, @Param('skillName') skillName: string) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteSkill(skillName, req.user.sub);
    } catch (error) {
      this.handleException(error, `Failed to delete skill: ${skillName}`);
    }
  }

  @Post('education')
  @UsePipes(new ValidationPipe())
  async addEducation(@Req() req, @Body() education: EducationDto) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.addEducation(education, req.user.sub);
    } catch (error) {
      this.handleException(error, 'Failed to add education.');
    }
  }

  @Patch('education/:educationId')
  @UsePipes(new ValidationPipe())
  @ApiBody({
    type: EducationDto,
    description: 'Fields to update',
    isArray: false,
  })
  async editEducation(
    @Req() req,
    @Body() updateEducationDto: Partial<EducationDto>,
    @Param('educationId') educationId: Types.ObjectId,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.editEducation(
        updateEducationDto,
        req.user.sub,
        educationId,
      );
    } catch (error) {
      this.handleException(error, `Failed to edit education.`);
    }
  }

  @Delete('education/:educationId')
  @UsePipes(new ValidationPipe())
  async deleteEducation(@Req() req, @Param('educationId') educationId: string) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteEducation(
        new Types.ObjectId(educationId),
        req.user.sub,
      );
    } catch (error) {
      this.handleException(error, `Failed to delete education.`);
    }
  }

  @Post('certification')
  @UsePipes(new ValidationPipe())
  async addCertification(@Req() req, @Body() certification: CertificationDto) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.addCertification(
        certification,
        req.user.sub,
      );
    } catch (error) {
      this.handleException(error, 'Failed to add certification.');
    }
  }

  @Patch('certification/:certificationId')
  @UsePipes(new ValidationPipe())
  @ApiBody({
    type: CertificationDto,
    description: 'Fields to update',
    isArray: false,
  })
  async editCertification(
    @Req() req,
    @Body() updateCertificationDto: Partial<CertificationDto>,
    @Param('certificationId') certificationId: Types.ObjectId,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.editCertification(
        updateCertificationDto,
        req.user.sub,
        certificationId,
      );
    } catch (error) {
      this.handleException(error, `Failed to edit certification.`);
    }
  }

  @Delete('certification/:certificationId')
  @UsePipes(new ValidationPipe())
  async deleteCertification(
    @Req() req,
    @Param('certificationId') certificationId: string,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteCertification(
        new Types.ObjectId(certificationId),
        req.user.sub,
      );
    } catch (error) {
      this.handleException(error, `Failed to delete certification.`);
    }
  }

  @Post('work-experience')
  @UsePipes(new ValidationPipe())
  async addWorkExperience(
    @Req() req,
    @Body() workExperience: WorkExperienceDto,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.addWorkExperience(
        workExperience,
        req.user.sub,
      );
    } catch (error) {
      this.handleException(error, 'Failed to add work experience.');
    }
  }

  @Patch('work-experience/:workExperienceId')
  @UsePipes(new ValidationPipe())
  @ApiBody({
    type: WorkExperienceDto,
    description: 'Fields to update',
    isArray: false,
  })
  async editWorkExperience(
    @Req() req,
    @Body() updateWorkExperienceDto: Partial<WorkExperienceDto>,
    @Param('workExperienceId') workExperienceId: Types.ObjectId,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.editWorkExperience(
        updateWorkExperienceDto,
        req.user.sub,
        workExperienceId,
      );
    } catch (error) {
      this.handleException(error, `Failed to edit work experience.`);
    }
  }

  @Delete('work-experience/:workExperienceId')
  @UsePipes(new ValidationPipe())
  async deleteWorkExperience(
    @Req() req,
    @Param('workExperienceId') workExperienceId: string,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteWorkExperience(
        new Types.ObjectId(workExperienceId),
        req.user.sub,
      );
    } catch (error) {
      this.handleException(error, `Failed to delete work experience.`);
    }
  }

  @Get('/followed-companies/:userId')
  async getFollowedCompanies(@Param('userId') userId: string, @Req() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated.');
      }

      return await this.profilesService.getFollowedCompanies(
        new Types.ObjectId(userId),
      );
    } catch (error) {
      this.handleException(error, `Failed to get followed companies.`);
    }
  }

  @Get('/posts/:userId')
  async getPosts(@Param('userId') userId: string, @Req() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated.');
      }
      return await this.postsService.getUserPosts(userId, req.user['sub']);
    } catch (error) {
      this.handleException(error, `Failed to get posts.`);
    }
  }
}
