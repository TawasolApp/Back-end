import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Education, Profile } from './infrastructure/database/profile.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import {
  toCreateCertificationSchema,
  toCreateEducationSchema,
  toCreateProfileSchema,
  toCreateSkillSchema,
  toGetProfileDto,
  toUpdateCertificationSchema,
  toUpdateEducationSchema,
  toUpdateProfileSchema,
} from './dto/profile.mapper';
import { EducationDto } from './dto/education.dto';
import { CertificationDto } from './dto/certification.dto';

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
    const newSkill = toCreateSkillSchema(skill);
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        $addToSet: {
          skills: newSkill,
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

  async addEducation(education: EducationDto, id: Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    const profile = await this.profileModel.findById(new Types.ObjectId(id));
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const newEducation = toCreateEducationSchema(education);
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        $addToSet: {
          education: newEducation,
        },
      },
      { new: true, runValidators: true },
    );
    if (!updatedProfile) {
      throw new NotFoundException('Updated Profile not found');
    }
    return toGetProfileDto(updatedProfile);
  }


  async editEducation(
    education: Partial<EducationDto>,
    id: Types.ObjectId,
    educationId: Types.ObjectId,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    
    const profile = await this.profileModel.findById(new Types.ObjectId(id));
    if (!profile) {
      throw new NotFoundException('Profile not found 1');
    }
    if (!(profile.education?.some(e => e._id.toString() === educationId.toString()))) {
      throw new NotFoundException(`Education entry with ID ${educationId} not found in profile`);
    }
    const updateData = toUpdateEducationSchema(education);
    console.log('editEducation service data id: ' + updateData.degree);
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), 'education._id': new Types.ObjectId(educationId) }, // Find profile and specific education entry
      { 
        $set: { 
          'education.$.school': updateData.school,
        'education.$.degree': updateData.degree,
        'education.$.field': updateData.field,
        'education.$.start_date': updateData.start_date,
        'education.$.end_date': updateData.end_date,
        'education.$.grade': updateData.grade,
        'education.$.description': updateData.description
        } 
      },
      { new: true, runValidators: true }
    );
  
    
    console.log('editEducation service updated profile: ' + updatedProfile);
    if (!updatedProfile) {
      throw new NotFoundException('Education not found in profile');
    }
  
    return toGetProfileDto(updatedProfile);
  }

  async deleteEducation(educationId: Types.ObjectId, id: Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    const profile = await this.profileModel.findById(new Types.ObjectId(id));
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), 'education._id': educationId },
      { $pull: { education: { _id: educationId } } },
      { new: true },
    );
    if (!updatedProfile) {
      throw new NotFoundException('Education not found in profile');
    }
    return toGetProfileDto(updatedProfile);
  }

  async addCertification(certification: CertificationDto, id: Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    const profile = await this.profileModel.findById(new Types.ObjectId(id));
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const newCertification = toCreateCertificationSchema(certification);
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        $addToSet: {
          certification: newCertification,
        },
      },
      { new: true, runValidators: true },
    );
    if (!updatedProfile) {
      throw new NotFoundException('Updated Profile not found');
    }
    return toGetProfileDto(updatedProfile);
  }
  
    async editCertification(
    certification: Partial<CertificationDto>, // Assuming you have a CertificationDto
    id: Types.ObjectId,
    certificationId: Types.ObjectId,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
  
    const profile = await this.profileModel.findById(new Types.ObjectId(id));
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
  
    if (!(profile.certification?.some(c => c._id.toString() === certificationId.toString()))) {
      throw new NotFoundException(`Certification entry with ID ${certificationId} not found in profile`);
    }
  
    const updateData = toUpdateCertificationSchema(certification); // Assuming you have a similar transformation function
    console.log('editCertification service data name: ' + updateData.name);
  
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), 'certification._id': new Types.ObjectId(certificationId) }, // Find profile and specific certification entry
      {
        $set: {
          'certification.$.name': updateData.name,
          'certification.$.company': updateData.company,
          'certification.$.issue_date': updateData.issue_date,
         
        },
      },
      { new: true, runValidators: true }
    );
  
    console.log('editCertification service updated profile: ' + updatedProfile);
    if (!updatedProfile) {
      throw new NotFoundException('Certification not found in profile');
    }
  
    return toGetProfileDto(updatedProfile); // Assuming this function converts the profile to a DTO
  }

  async deleteCertification(certificationId: Types.ObjectId, id: Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), 'certification._id': certificationId },
      { $pull: { certification: { _id: certificationId } } },
      { new: true },
    );
    if (!updatedProfile) {
      throw new NotFoundException('Certification not found in profile');
    }
    return toGetProfileDto(updatedProfile);
  }

}
