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
import { Skill } from './infrastructure/database/profile.schema';
import { SkillDto } from './dto/skill.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('profile')
export class ProfilesController {
  private _id: Types.ObjectId = new Types.ObjectId('67e215fc3f9cdc8e6040a90a');

  constructor(private profilesService: ProfilesService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  createProfile(@Body() createProfileDto:CreateProfileDto) {
    if (createProfileDto.skills && createProfileDto.skills.length > 0) {
      console.log("createProfile controller: " + createProfileDto.skills[0].skillName);
    } else {
      console.log("createProfile controller: No skills provided");
    }
    return this.profilesService.createProfile(createProfileDto);
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
  updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.updateProfile( updateProfileDto,this._id);
  }


  @Delete('profile-picture')
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard)
  deleteProfilePicture(@Req() req) {
    console.log("deleteProfilePicture controller: " + req.user.sub);
    return this.profilesService.deleteProfilePicture(req.user.sub);
  }

  @Delete('cover-photo')
  @UsePipes(new ValidationPipe())
  @UseGuards(JwtAuthGuard)
  deleteCoverPhoto() {
    return this.profilesService.deleteCoverPhoto(this._id);
  }

  @Delete('resume')
  @UsePipes(new ValidationPipe())
  deleteResume() {
    return this.profilesService.deleteResume(this._id);
  }

  @Delete('headline')
  @UsePipes(new ValidationPipe())
  deleteHeadline() {
    return this.profilesService.deleteHeadline(this._id);
  }

  @Delete('bio')
  @UsePipes(new ValidationPipe())
  deleteBio() {
    return this.profilesService.deleteBio(this._id);
  }

  @Delete('location')
  @UsePipes(new ValidationPipe())
  deleteLocation() {
    return this.profilesService.deleteLocation(this._id);
  }

  @Delete('industry')
  @UsePipes(new ValidationPipe())
  deleteIndustry() {
    return this.profilesService.deleteIndustry(this._id);
  }


  @Patch('skills')
  @UsePipes(new ValidationPipe())
  addSkill(@Body() skill: SkillDto) {
    console.log("addSkill controller: " + skill.skillName);
    return this.profilesService.addSkill(skill,this._id);
  }

  @Delete('skills/:skill_name')
  @UsePipes(new ValidationPipe())
  deleteSkill(@Param('skill_name') skillName: string, ) {
    return this.profilesService.deleteSkill(skillName, this._id);
  }

}
