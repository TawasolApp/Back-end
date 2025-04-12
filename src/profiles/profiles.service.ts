import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Profile,
  ProfileDocument,
} from './infrastructure/database/schemas/profile.schema';
import {
  UserConnection,
  UserConnectionDocument,
} from '../connections/infrastructure/database/schemas/user-connection.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SkillDto } from './dto/skill.dto';
import {
  toCreateCertificationSchema,
  toCreateEducationSchema,
  toCreateProfileSchema,
  toCreateSkillSchema,
  toCreateWorkExperienceSchema,
  toGetProfileDto,
  toUpdateCertificationSchema,
  toUpdateProfileSchema,
} from './dto/profile.mapper';
import { EducationDto } from './dto/education.dto';
import { CertificationDto } from './dto/certification.dto';
import { WorkExperienceDto } from './dto/work-experience.dto';
import { handleError } from '../common/utils/exception-handler';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/schemas/user.schema';
import {
  setConnectionStatus,
  setFollowStatus,
} from './helpers/set-status.utils';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(UserConnection.name)
    private readonly userConnectionModel: Model<UserConnectionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
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
    const { firstName, lastName } = await this.getUserFirstLastName(id);

    const profileData = toCreateProfileSchema(
      id,
      firstName,
      lastName,
      createProfileDto,
    );
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
  async getProfile(id: Types.ObjectId, loggedInUser: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    console.log('getProfile service id : ' + id);
    const profile = await this.profileModel.findById(id).exec();

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    const profileDto = toGetProfileDto(profile);
    profileDto.connectStatus = await setConnectionStatus(
      this.userConnectionModel,
      loggedInUser,
      id.toString(),
    );
    profileDto.followStatus = await setFollowStatus(
      this.userConnectionModel,
      loggedInUser,
      id.toString(),
    );
    return profileDto;
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
    if (updateProfileDto.firstName != undefined) {
      await this.updateUserFirstName(updateProfileDto.firstName, id);
    }
    if (updateProfileDto.lastName != undefined) {
      await this.updateUserLastName(updateProfileDto.lastName, id);
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
      throw new NotFoundException(
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
   * Edits an existing skill in a user's profile.
   * @param skill - DTO containing updated skill information.
   * @param id - The profile ID.
   * @param skillId - The skill ID.
   */
  async editSkillPosition(
    skillName: string,
    position: string,
    profileId: Types.ObjectId,
  ) {
    if (!isValidObjectId(profileId)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    console.log('editSkillPosition service profileId: ' + position);
    // Find the profile by profileId and update the specific skill's position
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(profileId), 'skills.skill_name': skillName }, // Match profileId and skillId in skills array
      {
        $set: {
          'skills.$.position': position, // Update the position of the skill
        },
      },
      { new: true, runValidators: true },
    );
    console.log('after editSkillPosition service profileId: ' + position);
    if (!updatedProfile) {
      throw new NotFoundException('Profile or Skill not found');
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

  /**
   * Adds an education entry to a user's profile.
   * @param education - DTO containing education information.
   * @param id - The profile ID.
   */

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

  /**
   * Edits an existing education entry in a user's profile.
   * @param education - DTO containing updated education information.
   * @param id - The profile ID.
   * @param educationId - The education entry ID.
   */
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
    if (
      !profile.education?.some(
        (e) => e._id.toString() === educationId.toString(),
      )
    ) {
      throw new NotFoundException(
        `Education entry with ID ${educationId} not found in profile`,
      );
    }

    console.log('editEducation service data id: ' + education.degree);
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        'education._id': new Types.ObjectId(educationId),
      }, // Find profile and specific education entry
      {
        $set: {
          'education.$.school': education.school,
          'education.$.degree': education.degree,
          'education.$.field': education.field,
          'education.$.start_date': education.startDate,
          'education.$.end_date': education.endDate,
          'education.$.grade': education.grade,
          'education.$.description': education.description,
          'education.$.company_logo': education.companyLogo,
          'education.$.company_id': education.companyId,
        },
      },
      { new: true, runValidators: true },
    );

    console.log('editEducation service updated profile: ' + updatedProfile);
    if (!updatedProfile) {
      throw new NotFoundException('Education not found in profile');
    }

    return toGetProfileDto(updatedProfile);
  }

  /**
   * Deletes an education entry from a user's profile.
   * @param educationId - The education entry ID.
   * @param id - The profile ID.
   */
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
  /**
   * Adds a certification entry to a user's profile.
   * @param certification - DTO containing certification information.
   * @param id - The profile ID.
   */
  async addCertification(certification: CertificationDto, id: Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }
    const profile = await this.profileModel.findById(new Types.ObjectId(id));
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    console.log('addCertification service profile: ' + certification.name);
    const newCertification = toCreateCertificationSchema(certification);
    console.log(
      'addCertification service newCertification: ' + newCertification.name,
      newCertification._id,
      newCertification.company_id,
      newCertification.company_logo,
      newCertification.issue_date,
      newCertification.expiry_date,
    );
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        $addToSet: {
          certification: newCertification,
        },
      },
      { new: true, runValidators: true },
    );
    console.log('addCertification service profile: ' + certification.name);
    if (!updatedProfile) {
      throw new NotFoundException('Updated Profile not found');
    }
    return toGetProfileDto(updatedProfile);
  }
  /**
   * Edits an existing certification entry in a user's profile.
   * @param certification - DTO containing updated certification information.
   * @param id - The profile ID.
   * @param certificationId - The certification entry ID.
   */
  async editCertification(
    certification: Partial<CertificationDto>,
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

    if (
      !profile.certification?.some(
        (c) => c._id.toString() === certificationId.toString(),
      )
    ) {
      throw new NotFoundException(
        `Certification entry with ID ${certificationId} not found in profile`,
      );
    }

    const updateData = toUpdateCertificationSchema(certification);

    const updatedProfile = await this.profileModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        'certification._id': new Types.ObjectId(certificationId),
      },
      {
        $set: {
          'certification.$.name': certification.name,
          'certification.$.company': certification.company,
          'certification.$.issue_date': certification.issueDate,
          'certification.$.expiry_date': certification.expiryDate,
          'certification.$.company_logo': certification.companyLogo,
          'certification.$.company_id': certification.companyId,
        },
      },
      { new: true, runValidators: true },
    );

    console.log('editCertification service updated profile: ' + updatedProfile);
    if (!updatedProfile) {
      throw new NotFoundException('Certification not found in profile');
    }

    return toGetProfileDto(updatedProfile);
  }
  /**
   * Deletes a certification entry from a user's profile.
   * @param certificationId - The certification entry ID.
   * @param id - The profile ID.
   */
  async deleteCertification(
    certificationId: Types.ObjectId,
    id: Types.ObjectId,
  ) {
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
  /**
   * Adds a work experience entry to a user's profile.
   * @param workExperience - DTO containing work experience information.
   * @param id - The profile ID.
   */
  async addWorkExperience(
    workExperience: WorkExperienceDto,
    id: Types.ObjectId,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }

    const profile = await this.profileModel.findById(new Types.ObjectId(id));
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const newWorkExperience = toCreateWorkExperienceSchema(workExperience);
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id) },
      {
        $addToSet: {
          work_experience: newWorkExperience,
        },
      },
      { new: true, runValidators: true },
    );

    if (!updatedProfile) {
      throw new NotFoundException('Updated Profile not found');
    }

    return toGetProfileDto(updatedProfile);
  }
  /**
   * Edits an existing work experience entry in a user's profile.
   * @param workExperience - DTO containing updated work experience information.
   * @param id - The profile ID.
   * @param workExperienceId - The work experience entry ID.
   */
  async editWorkExperience(
    workExperience: Partial<WorkExperienceDto>,
    id: Types.ObjectId,
    workExperienceId: Types.ObjectId,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }

    const profile = await this.profileModel.findById(new Types.ObjectId(id));
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    if (
      !profile.work_experience?.some(
        (we) => we._id.toString() === workExperienceId.toString(),
      )
    ) {
      throw new NotFoundException(
        `Work experience entry with ID ${workExperienceId} not found in profile`,
      );
    }

    console.log(
      'editWorkExperience service title: ' + workExperience.companyLogo,
    );
    // const updateData = toUpdateWorkExperienceSchema(workExperience);

    const updatedProfile = await this.profileModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        'work_experience._id': new Types.ObjectId(workExperienceId),
      },
      {
        $set: {
          'work_experience.$.title': workExperience.title,
          'work_experience.$.company': workExperience.company,
          'work_experience.$.start_date': workExperience.startDate,
          'work_experience.$.end_date': workExperience.endDate,
          'work_experience.$.employment_type': workExperience.employmentType,
          'work_experience.$.location': workExperience.location,
          'work_experience.$.location_type': workExperience.locationType,
          'work_experience.$.description': workExperience.description,
          'work_experience.$.company_logo': workExperience.companyLogo,
          'work_experience.$.company_id': workExperience.companyId,
        },
      },
      { new: true, runValidators: true },
    );
    console.log('editWorkExperience service updated profile:  update profile');

    if (!updatedProfile) {
      throw new NotFoundException('Work experience not found in profile');
    }

    return toGetProfileDto(updatedProfile);
  }
  /**
   * Deletes a work experience entry from a user's profile.
   * @param workExperienceId - The work experience entry ID.
   * @param id - The profile ID.
   */
  async deleteWorkExperience(
    workExperienceId: Types.ObjectId,
    id: Types.ObjectId,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }

    const updatedProfile = await this.profileModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), 'work_experience._id': workExperienceId },
      { $pull: { work_experience: { _id: workExperienceId } } },
      { new: true },
    );

    if (!updatedProfile) {
      throw new NotFoundException('Work experience not found in profile');
    }

    return toGetProfileDto(updatedProfile);
  }
  /**
   * Retrieves the first and last name of a user by ID.
   * @param id - The user ID.
   */
  async getUserFirstLastName(id: Types.ObjectId) {
    try {
      const user = await this.userModel
        .findById(id)
        .select('first_name last_name')
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        firstName: user.first_name,
        lastName: user.last_name,
      };
    } catch (error) {
      handleError(error, 'Failed to get user first and last name');
    }
  }
  /**
   * Updates the first name of a user by ID.
   * @param firstName - The new first name.
   * @param id - The user ID.
   */
  async updateUserFirstName(firstName: string, id: Types.ObjectId) {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(
          id,
          { first_name: firstName },
          { new: true, runValidators: true },
        )
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }
    } catch (error) {
      handleError(error, 'Failed to update user first name');
    }
  }
  /**
   * Updates the last name of a user by ID.
   * @param lastName - The new last name.
   * @param id - The user ID.
   */
  async updateUserLastName(lastName: string, id: Types.ObjectId) {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(
          id,
          { last_name: lastName },
          { new: true, runValidators: true },
        )
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }
    } catch (error) {
      handleError(error, 'Failed to update user last name');
    }
  }
  /**
   * Retrieves the endorsements for a specific skill in a user's profile.
   * @param skillName - The skill name.
   * @param id - The profile ID.
   */
  async getSkillEndorsements(skillName: string, id: Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid profile ID format');
    }

    const profile = await this.profileModel.findById(new Types.ObjectId(id));
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    const skill = profile.skills?.find(
      (s) => s.skill_name?.toLowerCase() === skillName.toLowerCase(),
    );
    if (!skill) {
      throw new NotFoundException(`Skill '${skillName}' not found`);
    }
    console.log('skill endorsements: ' + skill.endorsements);

    // Now fetch users from the endorsements list
    const endorsers = await this.profileModel
      .find({ _id: { $in: skill.endorsements } })
      .select('_id profile_picture first_name last_name');

    return endorsers.map((user) => ({
      _id: user._id,
      profilePicture: user.profile_picture,
      firstName: user.first_name,
      lastName: user.last_name,
    }));
  }
}
