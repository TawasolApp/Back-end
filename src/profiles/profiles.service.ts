import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Profile } from './infrastructure/database/profile.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import {
  toCreateProfileSchema,
  toGetProfileDto,
  toUpdateProfileSchema,
} from './dto/profile.mapper';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}
  /**
   * Creates a new profile for a user.
   * @param id - The user ID.
   * @param createProfileDto - DTO containing profile creation data.
   */
  async createProfile(id: Types.ObjectId, createProfileDto: CreateProfileDto) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    console.log('createProfile service: ' + createProfileDto.name);

    const profileData = toCreateProfileSchema(id, createProfileDto);
    try {
      const createdProfile = await this.profileModel.create(profileData);
      await createdProfile.save();
      return toGetProfileDto(createdProfile);
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new ConflictException('Profile for this user already exists');
      }
      throw new BadRequestException('Failed to create profile');
    }
  }

  /**
   * Retrieves a profile by ID.
   * @param id - The profile ID.
   */
  async getProfile(id: Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    console.log('getProfile service id : ' + id);
    const profile = await this.profileModel.findById(id).exec();
    console.log('getProfile service: ' + profile);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return toGetProfileDto(profile);
  }
  /**
   * Updates an existing profile.
   * @param updateProfileDto - DTO containing update data.
   * @param id - The profile ID.
   */
  async updateProfile(updateProfileDto: UpdateProfileDto, id: Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    console.log('updateProfile service id: ' + id);
    console.log('updateProfile service name: ' + updateProfileDto.headline);
    const updateData = toUpdateProfileSchema(updateProfileDto);
    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .exec();
    console.log('updateProfile service updated profile: ' + updatedProfile);

    if (!updatedProfile) {
      throw new NotFoundException(`Profile not found`);
    }

    return toGetProfileDto(updatedProfile);
  }
  /**
   * Deletes a specific field in a profile.
   * @param id - The profile ID.
   * @param field - The field to be deleted.
   */
  async deleteProfileField(id: Types.ObjectId, field: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }

    console.log('deleteProfile service: ' + id);
    const profile = await this.profileModel
      .findById(new Types.ObjectId(id))
      .exec();
    console.log('deleteProfile service profile: ' + profile);
    if (!profile) {
      throw new NotFoundException(`Profile not found`);
    }

    if (!profile[field]) {
      throw new BadRequestException(
        `${field} is already unset or does not exist`,
      );
    }

    const updatedProfile = await this.profileModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id) },
        { $unset: { [field]: '' } },
        { new: true, runValidators: true },
      )
      .exec();

    console.log('deleteProfile service updated profile: ' + updatedProfile);
    if (!updatedProfile) {
      throw new NotFoundException(`Updated Profile not found`);
    }

    return toGetProfileDto(updatedProfile);
  }
  /**
   * Deletes various profile fields.
   */
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

  /**
   * Adds a skill to a user's profile.
   * @param skill - DTO containing skill information.
   * @param id - The profile ID.
   */
  async addSkill(skill: SkillDto, id: Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    const profile = await this.profileModel.findById(new Types.ObjectId(id));
    console.log('addSkill service: ' + profile);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    if (
      (profile.skills ?? []).some(
        (s) => s.skill_name.toLowerCase() === skill.skillName.toLowerCase(),
      )
    ) {
      throw new ConflictException(`Skill '${skill.skillName}' already exists`);
    }
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        $addToSet: {
          skills: { skill_name: skill.skillName, endorsements: [] },
        },
      },
      { new: true, runValidators: true },
    );
    console.log('addSkill service updated Profile : ' + updatedProfile);
    if (!updatedProfile) {
      throw new NotFoundException('updated Profile not found');
    }
    return toGetProfileDto(updatedProfile);
  }

  /**
   * Deletes a skill from a user's profile.
   * @param skillName - The skill name to be removed.
   * @param id - The profile ID.
   */
  async deleteSkill(skillName: string, id: Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), 'skills.skill_name': skillName },
      { $pull: { skills: { skill_name: skillName } } },
      { new: true },
    );
    if (!updatedProfile) {
      throw new NotFoundException(`Skill '${skillName}' not found in profile`);
    }
    return toGetProfileDto(updatedProfile);
  }
}
