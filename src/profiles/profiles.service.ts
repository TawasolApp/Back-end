import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Profile } from './infrastructure/database/profile.schema';
import { Model, Types } from 'mongoose';
import { pick } from 'lodash';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import { toCreateProfileSchema, toGetProfileDto, toUpdateProfileSchema } from './dto/profile.mapper';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}

  async createProfile(createProfileDto: CreateProfileDto) {
    const profileData = toCreateProfileSchema(createProfileDto);
    const createdProfile = new this.profileModel(profileData);
    await createdProfile.save();
    return toGetProfileDto(createdProfile);
  }
  
  async getProfile(_id: Types.ObjectId) {
    const profile = await this.profileModel.findById(_id).exec();
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return toGetProfileDto(profile);
  }

  async updateProfile(updateProfileDto: UpdateProfileDto, _id: Types.ObjectId) {
    const updateData = toUpdateProfileSchema(updateProfileDto);
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id },
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }

    return toGetProfileDto(updatedProfile);
  }

  async deleteProfileField(_id: Types.ObjectId, field: string) {
    console.log("deleteProfile service: " + _id);
    const profile = await this.profileModel.findById(new Types.ObjectId(_id)).exec();
    console.log("deleteProfile service profile: " + profile);
    if (!profile) {
      throw new NotFoundException(`Profile not found`);
    }
    if (!profile[field]) {
      throw new BadRequestException(`${field} is already unset or does not exist`);
    }
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id },
        { $unset: { [field]: '' } },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }
    return toGetProfileDto(updatedProfile);
  }

  async deleteHeadline(_id: Types.ObjectId) {
    return this.deleteProfileField(_id, 'headline');
  }

  async deleteBio(_id: Types.ObjectId) {
    return this.deleteProfileField(_id, 'bio');
  }

  async deleteLocation(_id: Types.ObjectId) {
    return this.deleteProfileField(_id, 'location');
  }

  async deleteIndustry(_id: Types.ObjectId) {
    return this.deleteProfileField(_id, 'industry');
  }
  async deleteProfilePicture(_id: Types.ObjectId) {
    return this.deleteProfileField(_id, 'profile_picture');
  }
  async deleteCoverPhoto(_id: Types.ObjectId) {
    return this.deleteProfileField(_id, 'cover_photo');
  }
  async deleteResume(_id: Types.ObjectId) {
    return this.deleteProfileField(_id, 'resume');
  }
  

  async addSkill(skill: SkillDto, _id: Types.ObjectId) {
    const profile = await this.profileModel.findById(_id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    if ((profile.skills ?? []).some(s => s.skill_name.toLowerCase() === skill.skillName.toLowerCase())) {
      throw new BadRequestException(`Skill '${skill.skillName}' already exists`);
    }
    const updatedProfile = await this.profileModel.findByIdAndUpdate(
      _id,
      { $addToSet: { skills: { skill_name: skill.skillName, endorsements: [] } } },
      { new: true, runValidators: true },
    );
    if (!updatedProfile) {
      throw new NotFoundException('Profile not found');
    }
    return toGetProfileDto(updatedProfile);
  }

  async deleteSkill(skillName: string, _id: Types.ObjectId) {
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id, 'skills.skill_name': skillName },
      { $pull: { skills: { skill_name: skillName } } },
      { new: true }
    );
    if (!updatedProfile) {
      throw new NotFoundException(`Skill '${skillName}' not found in profile`);
    }
    return toGetProfileDto(updatedProfile);
  }
}
