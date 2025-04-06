import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Profile } from './infrastructure/database/schemas/profile.schema';
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
  toUpdateEducationSchema,
  toUpdateProfileSchema,
} from './dto/profile.mapper';
import { EducationDto } from './dto/education.dto';
import { CertificationDto } from './dto/certification.dto';
import { WorkExperienceDto } from './dto/work-experience.dto';
import {
  CompanyConnection,
  CompanyConnectionDocument,
} from '../companies/infrastructure/database/schemas/company-connection.schema';
import {
  Company,
  CompanyDocument,
} from '../companies/infrastructure/database/schemas/company.schema';
import { toGetCompanyDto } from '../companies/mappers/company.mapper';
import { handleError } from '../common/utils/exception-handler';
import { GetCompanyDto } from '../companies/dtos/get-company.dto';
import {
  User,
  UserDocument,
} from '../users/infrastructure/database/schemas/user.schema';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectModel(Profile.name) private readonly profileModel: Model<Profile>,
    @InjectModel(CompanyConnection.name)
    private readonly companyConnectionModel: Model<CompanyConnectionDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,

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
    if (updateProfileDto.firstName != undefined) {
      await this.updateUserFirstName(updateProfileDto.firstName, id);
    }
    if (updateProfileDto.lastName != undefined) {
      await this.updateUserLastName(updateProfileDto.lastName, id);
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
    if (
      !profile.education?.some(
        (e) => e._id.toString() === educationId.toString(),
      )
    ) {
      throw new NotFoundException(
        `Education entry with ID ${educationId} not found in profile`,
      );
    }
    const updateData = toUpdateEducationSchema(education);
    console.log('editEducation service data id: ' + updateData.degree);
    const updatedProfile = await this.profileModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        'education._id': new Types.ObjectId(educationId),
      }, // Find profile and specific education entry
      {
        $set: {
          'education.$.school': updateData.school,
          'education.$.degree': updateData.degree,
          'education.$.field': updateData.field,
          'education.$.start_date': updateData.start_date,
          'education.$.end_date': updateData.end_date,
          'education.$.grade': updateData.grade,
          'education.$.description': updateData.description,
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

    if (
      !profile.certification?.some(
        (c) => c._id.toString() === certificationId.toString(),
      )
    ) {
      throw new NotFoundException(
        `Certification entry with ID ${certificationId} not found in profile`,
      );
    }

    const updateData = toUpdateCertificationSchema(certification); // Assuming you have a similar transformation function

    const updatedProfile = await this.profileModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        'certification._id': new Types.ObjectId(certificationId),
      }, // Find profile and specific certification entry
      {
        $set: {
          'certification.$.name': certification.name,
          'certification.$.company': certification.company,
          'certification.$.issue_date': certification.issueDate,
        },
      },
      { new: true, runValidators: true },
    );

    console.log('editCertification service updated profile: ' + updatedProfile);
    if (!updatedProfile) {
      throw new NotFoundException('Certification not found in profile');
    }

    return toGetProfileDto(updatedProfile); // Assuming this function converts the profile to a DTO
  }

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

    console.log('editWorkExperience service title: ' + workExperience.title);
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
          //'work_experience.$.employment_type': workExperience.employmentType,
          'work_experience.$.location': workExperience.location,
          //'work_experience.$.location_type': workExperience.locationType,
          'work_experience.$.description': workExperience.description,
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

  async getFollowedCompanies(id: Types.ObjectId): Promise<GetCompanyDto[]> {
    try {
      const connections = await this.companyConnectionModel
        .find({ user_id: new Types.ObjectId(id) })
        .sort({ created_at: -1 })
        .select('company_id')
        .lean();
      const followedCompanyIds = connections.map(
        (connection) => connection.company_id,
      );
      const companies = await this.companyModel
        .find({ _id: { $in: followedCompanyIds } })
        .select('_id name logo industry followers')
        .sort({ created_at: -1 })
        .lean();
      return companies.map(toGetCompanyDto);
    } catch (error) {
      handleError(error, 'Failed to retrieve list of followed companies.');
    }
  }

  async getUserFirstLastName(id: Types.ObjectId) {
    try {
      const user = await this.userModel
        .findById(id)
        .select('first_name last_name')
        .exec();

      if (!user) {
        throw new NotFoundException('User not found');
      }
      console.log('user first name:', user.first_name);
      console.log('user last name:', user.last_name);

      return {
        firstName: user.first_name,
        lastName: user.last_name,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve user name');
    }
  }

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
}
