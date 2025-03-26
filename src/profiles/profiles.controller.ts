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
@UseGuards(JwtAuthGuard)
@Controller('profile')
export class ProfilesController {
  

  constructor(private profilesService: ProfilesService) {}

  private handleException(error: any, defaultMessage: string) {
    if (error instanceof HttpException) {
      throw error;
    }
    throw new InternalServerErrorException(defaultMessage);
  }

  @Post()
  @UsePipes(new ValidationPipe())
  async createProfile(@Req() req, @Body() createProfileDto: CreateProfileDto) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.createProfile(req.user.sub, createProfileDto);
    } catch (error) {
      this.handleException(error, 'Failed to create profile.');
    }
  }

  @Get(':id')
  @UsePipes(new ValidationPipe())
  async getProfile(@Param('id') id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid profile ID format');
      }
      return await this.profilesService.getProfile(new Types.ObjectId(id));
    } catch (error) {
      this.handleException(error, 'Failed to retrieve profile.');
    }
  }

  @Patch()
  @UsePipes(new ValidationPipe())
  async updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.updateProfile(updateProfileDto, req.user.sub);
    } catch (error) {
      this.handleException(error, 'Failed to update profile.');
    }
  }

  

  @Delete('profile-picture')
  @UsePipes(new ValidationPipe())
  
  async deleteProfilePicture(@Req() req) {
   
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      console.log("deleteProfilePicture controller: " + req.user.sub);
      return await this.profilesService.deleteProfilePicture(req.user.sub);
    } catch (error) {
      this.handleException(error, `Failed to delete profile-picture.`);
    }
  }

  
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

  @Delete('skills/:skill_name')
  @UsePipes(new ValidationPipe())
  async deleteSkill(@Req() req, @Param('skill_name') skillName: string) {
    try {
      if (!req.user) {
        throw new UnauthorizedException('User not authenticated');
      }
      return await this.profilesService.deleteSkill(skillName, req.user.sub);
    } catch (error) {
      this.handleException(error, `Failed to delete skill: ${skillName}`);
    }
  }
}
