import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { Types } from 'mongoose';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { _ } from '@faker-js/faker/dist/airline-CBNP41sR';
import { CreateProfileDto } from './dto/create-profile.dto';

@Controller('profile')
export class ProfilesController {
  private _id: Types.ObjectId = new Types.ObjectId('67db55ce15ffd8fe5e96a1da');

  constructor(private profilesService: ProfilesService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  createProfile(@Body() createProfileDto:CreateProfileDto) {
    return this.profilesService.createProfile(createProfileDto);
  }

  @Get(':id')  
  @UsePipes(new ValidationPipe())
  getProfile(@Param('id') id: string) {
    console.log("getProfile controller username  " )
    return this.profilesService.getProfile(this._id);
    
  }

  @Put()
  @UsePipes(new ValidationPipe())
  updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.updateProfile( updateProfileDto,this._id);
  }

  @Patch('headline')
  @UsePipes(new ValidationPipe())
  updateHeadline(@Body() updateHeadlineDto: UpdateProfileDto) {
    return this.profilesService.updateHeadline(updateHeadlineDto,this._id);
  }

  @Patch('bio')
  @UsePipes(new ValidationPipe())
  updateBio(@Body() updateBioDto: UpdateProfileDto) {
    return this.profilesService.updateBio(updateBioDto,this._id);
  }

  @Patch('location')
  @UsePipes(new ValidationPipe())
  updateLocation(@Body() updateLocationDto: UpdateProfileDto) {
    return this.profilesService.updateLocation(updateLocationDto,this._id);
  }

  @Patch('industry')
  @UsePipes(new ValidationPipe())
  updateIndustry(@Body() updateIndustryDto: UpdateProfileDto) {
    return this.profilesService.updateIndustry(updateIndustryDto,this._id);
  }

  @Patch('profile-picture')
  @UsePipes(new ValidationPipe())
  updateProfilePicture(@Body() updateIndustryDto: UpdateProfileDto) {
    return this.profilesService.updateProfilePicture(updateIndustryDto,this._id);
  }

  @Delete('profile-picture')
  @UsePipes(new ValidationPipe())
  deleteProfilePicture() {
    return this.profilesService.deleteProfilePicture(this._id);
  }

  @Patch('cover-photo')
  @UsePipes(new ValidationPipe())
  uploadCoverPhoto(@Body() updateIndustryDto: UpdateProfileDto,) {
    return this.profilesService.uploadCoverPhoto(updateIndustryDto,this._id);
  }
}
