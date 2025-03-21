import { BadRequestException, ConflictException, Injectable, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Profile } from './infrastructure/database/profile.schema';
import { get, Model, Types } from 'mongoose';
import { pick } from 'lodash';
import { CreateProfileDto } from './dto/create-profile.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import { ne } from '@faker-js/faker/.';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}

  async createProfile(createProfileDto: CreateProfileDto) {
    
    const newProfile = new this.profileModel(createProfileDto);
    const savedProfile = await newProfile.save();
  
    // Dynamically pick fields from the DTO
    return pick(savedProfile.toObject(), Object.keys(createProfileDto));
  

  }

  async getProfile(_id:Types.ObjectId) {
    const createProfileDto= new CreateProfileDto();
    if (!Types.ObjectId.isValid(_id)) {
        throw new NotFoundException('Invalid profile ID');
    }

    // console.log('getProfile id : ' + _id);
    const getProfile= await this.profileModel.findOne({ _id: _id }).exec();
   // console.log('getProfile ' + getProfile);
    if (!getProfile) {
      throw new NotFoundException('Profile not found');
    }
    return  pick(getProfile.toObject(), Object.keys(createProfileDto));
   
  }

  async updateProfile(updateProfileDto: UpdateProfileDto, _id) {
    const createProfileDto= new CreateProfileDto();
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

    return  pick(updatedProfile.toObject(), Object.keys(createProfileDto));
  }

  async deleteProfilePicture(_id) {
    const createProfileDto = new CreateProfileDto();
    const profile = await this.profileModel.findOne({ _id: _id }).exec();
    if (!profile) {
      throw new NotFoundException(`Profile not found`);
    }
    if (!profile.profile_picture) {
      throw new BadRequestException(`Profile-Picture is already unset or does not exist`);
    }
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: _id },
        { $unset: { profile_picture: '' } },
        { new: true, runValidators: true },
      )
      .exec();
  
    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }
    return pick(updatedProfile.toObject(), Object.keys(createProfileDto));
  }

  async deleteCoverPhoto(_id) {
    const createProfileDto = new CreateProfileDto();
    const profile = await this.profileModel.findOne({ _id: _id }).exec();
    if (!profile) {
      throw new NotFoundException(`Profile not found`);
    }
    if (!profile.cover_photo) {
      throw new BadRequestException(`Cover-Photo is already unset or does not exist`);
    }
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
    return pick(updatedProfile.toObject(), Object.keys(createProfileDto));
  }

  async deleteResume(_id) {
    const createProfileDto = new CreateProfileDto();
    const profile = await this.profileModel.findOne({ _id: _id }).exec();
    if (!profile) {
      throw new NotFoundException(`Profile not found`);
    }
    if (!profile.resume) {
      throw new BadRequestException(`Resume is already unset or does not exist`);
    }
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
    return pick(updatedProfile.toObject(), Object.keys(createProfileDto));
  }

  async deleteHeadline(_id) {
    const createProfileDto = new CreateProfileDto();
    const profile = await this.profileModel.findOne({ _id: _id }).exec();
    if (!profile) {
      throw new NotFoundException(`Profile not found`);
    }
    if (!profile.headline) {
      throw new BadRequestException(`Headline is already unset or does not exist`);
    }
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
    return pick(updatedProfile.toObject(), Object.keys(createProfileDto));
  }

  async deleteBio(_id) {
    const createProfileDto = new CreateProfileDto();
    const profile = await this.profileModel.findOne({ _id: _id }).exec();
    if (!profile) {
      throw new NotFoundException(`Profile not found`);
    }
    if (!profile.bio) {
      throw new BadRequestException(`Bio is already unset or does not exist`);
    }
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
    return pick(updatedProfile.toObject(), Object.keys(createProfileDto));
  }

  async deleteLocation(_id) {
    const createProfileDto = new CreateProfileDto();
    const profile = await this.profileModel.findOne({ _id: _id }).exec();
    if (!profile) {
      throw new NotFoundException(`Profile not found`);
    }
    if (!profile.location) {
      throw new BadRequestException(`Location is already unset or does not exist`);
    }
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
    return pick(updatedProfile.toObject(), Object.keys(createProfileDto));
    }

  async deleteIndustry(_id) {
    const createProfileDto = new CreateProfileDto();

  // Step 1: Find the profile and check if the industry exists
  const profile = await this.profileModel.findOne({ _id: _id }).exec();
  if (!profile) {
    throw new NotFoundException(`Profile not found`);
  }

  if (!profile.industry) {
    throw new BadRequestException(`Industry is already unset or does not exist`);
    
  }

  // Step 2: Proceed to unset the industry field
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
  return pick(updatedProfile.toObject(), Object.keys(createProfileDto));
}

  async addSkill(skill: SkillDto, _id) {
    //  Fetch the profile to check existing skills
    const createProfileDto = new CreateProfileDto();
    const profile = await this.profileModel.findById(_id);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // Check if the skill already exists
    const skillExists = (profile.skills ?? []).some(
      (existingSkill) => existingSkill.skill_name.toLowerCase() === skill.skill_name.toLowerCase(),
    );

    if (skillExists) {
      throw new BadRequestException(`Skill '${skill.skill_name}' already exists`);
    }

   //Add skill and update profile
    const updatedProfile = await this.profileModel.findByIdAndUpdate(
      _id,
      { $push: { skills: skill } }, // Using `$push` since we already ensured uniqueness
      { new: true, runValidators: true },
    );
    if (!updatedProfile) {
      throw new NotFoundException('Profile not found');
    }

    return  pick(updatedProfile.toObject(), Object.keys(createProfileDto));
  }

  async deleteSkill(skillName: string, id): Promise<Profile> {
    const createProfileDto = new CreateProfileDto();
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: id, 'skills.skill_name': skillName }, // Ensure the skill exists before updating
      { $pull: { skills: { skill_name: skillName } } }, // Remove the skill
      { new: true }
    );
  
    if (!updatedProfile) {
      throw new NotFoundException(`Skill "${skillName}" not found in profile`);
    }
  
    return pick(updatedProfile.toObject(), Object.keys(createProfileDto));
  }
}
