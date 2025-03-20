import { ConflictException, Injectable, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Profile } from './infrastructure/database/profile.schema';
import { Model } from 'mongoose';
import { CreateProfileDto } from './dto/create-profile.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

    async getProfile(id) {
        
        return await this.profileModel.findOne({ _id:id }).exec();
    }

    async updateProfile( updateProfileDto: UpdateProfileDto,_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id:_id }, // Find by id
            { $set: updateProfileDto }, // Only update specified fields
            { new: true, runValidators: true } // Return updated document & apply validators
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

   

    

    async deleteProfilePicture(_id) {
        console.log("deleteProfilePicture id" +_id)
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id: _id },
            { $unset: { profile_picture: '' } },
            { new: true, runValidators: true }
        ).exec();
        console.log("deleteProfilePicture updatedProfile" +updatedProfile)  
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async deleteCoverPhoto(_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id: _id },
            { $unset: { cover_photo: '' } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async deleteResume(_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id: _id },
            { $unset: { resume: '' } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async deleteHeadline(_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id: _id },
            { $unset: { headline: '' } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async deleteBio(_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id: _id },
            { $unset: { bio: '' } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async deleteLocation(_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id: _id },
            { $unset: { location: '' } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async deleteIndustry(_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id: _id },
            { $unset: { industry: '' } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    
    
    
}

