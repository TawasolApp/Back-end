import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Profile } from './infrastructure/database/profile.schema';
import { Model } from 'mongoose';
import { CreateProfileDto } from './dto/create-profile.dto';

@Injectable()
export class ProfilesService {
constructor(@InjectModel(Profile.name) private profileModel: Model<Profile>) {}
    
    async createProfile(createProfileDto: CreateProfileDto) {
        const existingProfile = await this.profileModel.findOne({ username: createProfileDto.username }).exec();
        if (existingProfile) {
        throw new ConflictException('Username is already taken');
        }

        const newProfile = new this.profileModel(createProfileDto);
        return newProfile.save();
    }
    
}

