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
            { _id:_id }, // Find by username
            { $set: updateProfileDto }, // Only update specified fields
            { new: true, runValidators: true } // Return updated document & apply validators
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async updateHeadline(updateHeadlineDto: UpdateProfileDto,_id) {
        console.log("updateHeadlineDto")
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id:_id },
            { $set: { headline: updateHeadlineDto.headline } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async updateBio(updateBioDto: UpdateProfileDto,_id) {
        console.log("updateBioDto" +_id)
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id:_id },
            { $set: { bio: updateBioDto.bio } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async updateLocation(updateLocationDto: UpdateProfileDto,_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id:_id },
            { $set: { location: updateLocationDto.location } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async updateIndustry(updateIndustryDto: UpdateProfileDto,_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id:_id },
            { $set: { industry: updateIndustryDto.industry } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async updateProfilePicture(updateProfilePictureDto: UpdateProfileDto,_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id:_id },
            { $set: { profilePicture: updateProfilePictureDto.profile_picture } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async deleteProfilePicture(_id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id:_id },
            { $unset: { profilePicture: '' } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }

    async uploadCoverPhoto(updateCoverPhotoDto: UpdateProfileDto, _id) {
        const updatedProfile = await this.profileModel.findOneAndUpdate(
            { _id:_id},
            { $set: { coverPhoto: updateCoverPhotoDto.cover_photo } },
            { new: true, runValidators: true }
        ).exec();
    
        if (!updatedProfile) {
            throw new NotFoundException(`Profile not found`);
        }
    
        return updatedProfile;
    }
    
    
}

