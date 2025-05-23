import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CompaniesService } from '../companies/companies.service';
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
import { PostsService } from '../posts/posts.service';
import { handleError } from '../common/utils/exception-handler';

@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly companiesService: CompaniesService,
  ) {}

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
      handleError(error, 'Failed to create profile.');
    }
  }

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
      return await this.profilesService.getProfile(
        new Types.ObjectId(id),
        req.user.sub,
      );
    } catch (error) {
      handleError(error, 'Failed to retrieve profile.');
    }
  }

  @Get()
  @UsePipes(new ValidationPipe())
  async getMyProfile(@Req() req) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }

      return await this.profilesService.getProfile(
        new Types.ObjectId(req.user.sub),
        req.user.sub,
      );
    } catch (error) {
      handleError(error, 'Failed to retrieve profile.');
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
      handleError(error, 'Failed to update profile.');
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
      handleError(error, `Failed to delete profile-picture.`);
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
      handleError(error, `Failed to delete cover-photo.`);
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
      handleError(error, `Failed to delete resume.`);
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
      handleError(error, `Failed to delete headline.`);
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
      handleError(error, `Failed to delete bio.`);
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
      handleError(error, `Failed to delete location.`);
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
      handleError(error, `Failed to delete industry.`);
    }
  }

  /**
   * Adds a skill to the user's profile.
   * @param req - The request object containing the authenticated user
   * @param skill - The skill data transfer object
   */
  @Post('skills')
  @UsePipes(new ValidationPipe())
  async addSkill(@Req() req, @Body() skill: SkillDto) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.addSkill(skill, req.user.sub);
    } catch (error) {
      handleError(error, 'Failed to add skill.');
    }
  }

  @Patch('skills/:skillName')
  @UsePipes(new ValidationPipe())
  async editSkillPosition(
    @Req() req,
    @Param('skillName') skillName: string,
    @Body('position') position: string,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.editSkillPosition(
        skillName,
        position,
        req.user.sub,
      );
    } catch (error) {
      handleError(error, 'Failed to add skill.');
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
      handleError(error, `Failed to delete skill: ${skillName}`);
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
      handleError(error, 'Failed to add education.');
    }
  }

  @Patch('education/:education_id')
  @UsePipes(new ValidationPipe())
  @ApiBody({
    type: EducationDto,
    description: 'Fields to update',
    isArray: false,
  })
  async editEducation(
    @Req() req,
    @Body() updateEducationDto: Partial<EducationDto>,
    @Param('education_id') educationId: Types.ObjectId,
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
      handleError(error, `Failed to edit education.`);
    }
  }

  @Delete('education/:education_id')
  @UsePipes(new ValidationPipe())
  async deleteEducation(
    @Req() req,
    @Param('education_id') educationId: string,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteEducation(
        new Types.ObjectId(educationId),
        req.user.sub,
      );
    } catch (error) {
      return handleError(error, `Failed to delete education.`);
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
      handleError(error, 'Failed to add certification.');
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
      console.log('Error in addCertification:', error);
      handleError(error, `Failed to edit certification.`);
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
      handleError(error, `Failed to delete certification.`);
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
      handleError(error, 'Failed to add work experience.');
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
      handleError(error, `Failed to edit work experience.`);
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
      handleError(error, `Failed to delete work experience.`);
    }
  }

  @Get('skill-endorsements/:id')
  async getSkillEndorsements(
    @Req() req,
    @Param('id') id: Types.ObjectId,
    @Query('skill') skillName: string,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.getSkillEndorsements(skillName, id);
    } catch (error) {
      handleError(error, `Failed to get endorsements for skill: ${skillName}`);
    }
  }

  @Get('/followed-companies/:userId')
  async getFollowedCompanies(
    @Param('userId') userId: string,
    @Req() req,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated.');
      }
      return await this.companiesService.getFollowedCompanies(
        userId,
        page,
        limit,
      );
    } catch (error) {
      handleError(error, `Failed to get followed companies.`);
    }
  }
}
