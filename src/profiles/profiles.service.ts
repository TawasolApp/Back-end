import { BadRequestException, ConflictException, Injectable, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Profile } from './infrastructure/database/profile.schema';
import { Model, Types } from 'mongoose';

import { CreateProfileDto } from './dto/create-profile.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}

  async createProfile(createProfileDto: CreateProfileDto) {
    const existingProfile = await this.profileModel
      .findOne({ username: createProfileDto.username })
      .exec();
    if (existingProfile) {
      throw new ConflictException('Username is already taken');
    }

    const newProfile = new this.profileModel(createProfileDto);
    return newProfile.save();
  }

  async getProfile(_id:Types.ObjectId) {
    if (!Types.ObjectId.isValid(_id)) {
        throw new NotFoundException('Invalid profile ID');
    }

    // console.log('getProfile id : ' + _id);
    const getProfile= await this.profileModel.findOne({ _id: _id }).exec();
    // console.log('getProfile ' + getProfile);
    if (!getProfile) {
      throw new NotFoundException('Profile not found');
    }
    return getProfile;
  }

  async updateProfile(updateProfileDto: UpdateProfileDto, _id) {
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: _id }, // Find by id
        { $set: updateProfileDto }, // Only update specified fields
        { new: true, runValidators: true }, // Return updated document & apply validators
      )
      .exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }

    return updatedProfile;
  }

  async deleteProfilePicture(_id) {
    console.log('deleteProfilePicture id' + _id);
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: _id },
        { $unset: { profile_picture: '' } },
        { new: true, runValidators: true },
      )
      .exec();
    console.log('deleteProfilePicture updatedProfile' + updatedProfile);

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }

    return updatedProfile;
  }

  async deleteCoverPhoto(_id) {
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: _id },
        { $unset: { cover_photo: '' } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }

    return updatedProfile;
  }

  async deleteResume(_id) {
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: _id },
        { $unset: { resume: '' } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }

    return updatedProfile;
  }

  async deleteHeadline(_id) {
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: _id },
        { $unset: { headline: '' } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }

    return updatedProfile;
  }

  async deleteBio(_id) {
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: _id },
        { $unset: { bio: '' } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }

    return updatedProfile;
  }

  async deleteLocation(_id) {
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: _id },
        { $unset: { location: '' } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }

    return updatedProfile;
  }

  async deleteIndustry(_id) {
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: _id },
        { $unset: { industry: '' } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }

    return updatedProfile;
  }

  async addSkill(skill: SkillDto, _id) {
    //  Fetch the profile to check existing skills
    const profile = await this.profileModel.findById(_id);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Check if the skill already exists
    const skillExists = (profile.skills ?? []).some(
      (existingSkill) => existingSkill.skill_name.toLowerCase() === skill.skill_name.toLowerCase(),
    );

    if (skillExists) {
      throw new BadRequestException(`Skill "${skill.skill_name}" already exists`);
    }

   //Add skill and update profile
    const updatedProfile = await this.profileModel.findByIdAndUpdate(
      _id,
      { $push: { skills: skill } }, // Using `$push` since we already ensured uniqueness
      { new: true, runValidators: true },
    );

    return updatedProfile;
  }

  async deleteSkill(skillName: string, id): Promise<Profile> {
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: id, 'skills.skill_name': skillName }, // Ensure the skill exists before updating
      { $pull: { skills: { skill_name: skillName } } }, // Remove the skill
      { new: true }
    );
  
    if (!updatedProfile) {
      throw new NotFoundException(`Skill "${skillName}" not found in profile`);
    }
  
    return updatedProfile;
  }
}
