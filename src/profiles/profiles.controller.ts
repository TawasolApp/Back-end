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
  private _id: Types.ObjectId = new Types.ObjectId('67db6804aa310fcb0bc4da07');

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

  @Patch()
  @UsePipes(new ValidationPipe())
  updateProfile(@Body() updateProfileDto: UpdateProfileDto) {
    return this.profilesService.updateProfile( updateProfileDto,this._id);
  }




 


  @Delete('profile-picture')
  @UsePipes(new ValidationPipe())
  deleteProfilePicture() {
    return this.profilesService.deleteProfilePicture(this._id);
  }


}
