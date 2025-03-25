import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
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

  @Post()
  @UsePipes(new ValidationPipe())
  createProfile(@Req() req,@Body() createProfileDto:CreateProfileDto) {
    console.log("createProfile controller: " + createProfileDto.name);
    if (createProfileDto.skills && createProfileDto.skills.length > 0) {
      console.log("createProfile controller: " + createProfileDto.skills[0].skillName);
    } else {
      console.log("createProfile controller: No skills provided");
    }
    return this.profilesService.createProfile(req.user.sub,createProfileDto);
  }

  @Get(':id')  
  @UsePipes(new ValidationPipe())
  getProfile(@Param('id') id: string) {
    // console.log("getProfile controller username  " )
    let get_id: Types.ObjectId;
    try {
      get_id = new Types.ObjectId(id);
    } catch (error) {
      
      return { error: "Invalid profile ID" }; // Handle the error case
    }
    return this.profilesService.getProfile(get_id);
    
  }

  @Patch()
  @UsePipes(new ValidationPipe())
  updateProfile(@Req() req, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.updateProfile( updateProfileDto,req.user.sub);
  }


  @Delete('profile-picture')
  @UsePipes(new ValidationPipe())
  
  deleteProfilePicture(@Req() req) {
    console.log("deleteProfilePicture controller: " + req.user.sub);
    return this.profilesService.deleteProfilePicture(req.user.sub);
  }

  
  @Delete('cover-photo')
  @UsePipes(new ValidationPipe())
  
  deleteCoverPhoto(@Req() req) {
    return this.profilesService.deleteCoverPhoto(req.user.sub);
  }

  @Delete('resume')
  @UsePipes(new ValidationPipe())
  deleteResume(@Req() req) {
    
    return this.profilesService.deleteResume(req.user.sub);
  }

  @Delete('headline')
  @UsePipes(new ValidationPipe())
  deleteHeadline(@Req() req) {
    return this.profilesService.deleteHeadline(req.user.sub);
  }

  @Delete('bio')
  @UsePipes(new ValidationPipe())
  deleteBio(@Req() req) {
    return this.profilesService.deleteBio(req.user.sub);
  }

  @Delete('location')
  @UsePipes(new ValidationPipe())
  deleteLocation(@Req() req) {
    return this.profilesService.deleteLocation(req.user.sub);
  }

  @Delete('industry')
  @UsePipes(new ValidationPipe())
  deleteIndustry(@Req() req) {
    return this.profilesService.deleteIndustry(req.user.sub);
  }


  @Patch('skills')
  @UsePipes(new ValidationPipe())
  addSkill(@Req() req,@Body() skill: SkillDto) {
    console.log("addSkill controller: " + skill.skillName);
    return this.profilesService.addSkill(skill,req.user.sub);
  }

  @Delete('skills/:skill_name')
  @UsePipes(new ValidationPipe())
  deleteSkill(@Req() req,@Param('skill_name') skillName: string, ) {
    return this.profilesService.deleteSkill(skillName, req.user.sub);
  }

}
