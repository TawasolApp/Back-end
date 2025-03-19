import {
  Body,
  Controller,
  Delete,
  Get,
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

@Controller('profile')
export class ProfilesController {
  private _id: Types.ObjectId = new Types.ObjectId('67d970368674cc71ffc6a4f3');

  constructor(private profilesService: ProfilesService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  createProfile(@Body() createProfileDto) {
    return this.profilesService.createProfile(createProfileDto);
  }

  @Get()
  @UsePipes(new ValidationPipe())
  getProfile(@Body() user: { username: string }) {
    return this.profilesService.getProfile(user.username);
  }

  @Put()
  @UsePipes(new ValidationPipe())
  updateProfile(@Body(ValidationPipe) updateProfileDto) {
    return this.profilesService.updateProfile( updateProfileDto,this._id);
  }

  @Patch('headline')
  updateHeadline(@Body() updateHeadlineDto: UpdateProfileDto) {
    return this.profilesService.updateHeadline(updateHeadlineDto,this._id);
  }

  @Patch('bio')
  updateBio(@Body() updateBioDto: UpdateProfileDto) {
    return this.profilesService.updateBio(updateBioDto,this._id);
  }

  @Patch('location')
  updateLocation(@Body() updateLocationDto: UpdateProfileDto) {
    return this.profilesService.updateLocation(updateLocationDto,this._id);
  }

  @Patch('industry')
  updateIndustry(@Body() updateIndustryDto: UpdateProfileDto) {
    return this.profilesService.updateIndustry(updateIndustryDto,this._id);
  }

  @Post('profile-picture')
 
  updateProfilePicture(@Body() updateIndustryDto: UpdateProfileDto) {
    return this.profilesService.updateProfilePicture(updateIndustryDto,this._id);
  }

  @Delete('profile-picture')
  deleteProfilePicture() {
    return this.profilesService.deleteProfilePicture(this._id);
  }

  @Post('cover-photo')
  
  uploadCoverPhoto(@Body() updateIndustryDto: UpdateProfileDto,_id: Types.ObjectId) {
    return this.profilesService.uploadCoverPhoto(updateIndustryDto,_id);
  }
}
