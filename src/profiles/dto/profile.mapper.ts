import { Types } from 'mongoose';
import {
  Certification,
  Education,
  Profile,
} from '../infrastructure/database/schemas/profile.schema';
import { CreateProfileDto } from './create-profile.dto';
import { GetProfileDto } from './get-profile.dto';
import { UpdateProfileDto } from './update-profile.dto';
import { EducationDto } from './education.dto';
import { SkillDto } from './skill.dto';
import { CertificationDto } from './certification.dto';
import { WorkExperienceDto } from './work-experience.dto';
import {
  Visibility,
  EmploymentType,
  LocationType,
  PlanType,
  ProfileStatus,
} from '../enums/profile-enums';
import { Company } from 'src/companies/infrastructure/database/schemas/company.schema';

/**
 * Maps CreateProfileDto to the Profile schema.
 */
export function toCreateProfileSchema(
  id: Types.ObjectId,
  firstName: string,
  lastName: string,
  createProfileDto: Partial<CreateProfileDto>,
) {
  return {
    _id: new Types.ObjectId(id),
    first_name: firstName,
    last_name: lastName,
    profile_picture: createProfileDto.profilePicture,
    cover_photo: createProfileDto.coverPhoto,
    resume: createProfileDto.resume,
    headline: createProfileDto.headline,
    bio: createProfileDto.bio,
    location: createProfileDto.location,
    industry: createProfileDto.industry,

    skills: createProfileDto.skills?.map((skillDto) => ({
      skill_name: skillDto.skillName,
      position: skillDto.position,
      endorsements: [] as Types.ObjectId[],
    })),

    education:
      createProfileDto.education?.map((education) => ({
        school: education?.school,
        degree: education?.degree,
        field: education?.field,
        start_date: education?.startDate,
        end_date: education?.endDate,
        grade: education?.grade,
        description: education?.description,
        company_id: education?.companyId,
        company_logo: education?.companyLogo,
      })) ?? [],

    certification:
      createProfileDto.certification?.map((cert) => ({
        name: cert?.name ?? null,
        company: cert?.company ?? null,
        company_id: cert?.companyId ?? null,
        expiry_date: cert?.expiryDate ?? null,
        company_logo: cert?.companyLogo ?? null,
        issue_date: cert?.issueDate ? new Date(cert.issueDate) : new Date(),
      })) ?? [],

    work_experience:
      createProfileDto.workExperience?.map((work) => ({
        title: work.title,
        company: work.company,
        company_id: work.companyId ?? null,
        company_logo: work.companyLogo ?? null,
        employment_type: work.employmentType as EmploymentType,
        start_date: work.startDate ? new Date(work.startDate) : new Date(),
        end_date: work.endDate ? new Date(work.endDate) : new Date(),
        location: work.location,
        location_type: work.locationType as LocationType,
        description: work.description ?? null,
      })) ?? [],

    visibility: createProfileDto.visibility as Visibility,
  };
}

/**
 * Maps UpdateProfileDto to the Profile schema.
 */
export function toUpdateProfileSchema(
  updateProfileDto: Partial<UpdateProfileDto>,
): Partial<Profile> {
  return {
    ...(updateProfileDto.firstName && {
      first_name: updateProfileDto.firstName,
    }),

    ...(updateProfileDto.lastName && { last_name: updateProfileDto.lastName }),
    ...(updateProfileDto.bio && { bio: updateProfileDto.bio }),
    ...(updateProfileDto.location && { location: updateProfileDto.location }),
    ...(updateProfileDto.industry && { industry: updateProfileDto.industry }),
    ...(updateProfileDto.profilePicture && {
      profile_picture: updateProfileDto.profilePicture,
    }),
    ...(updateProfileDto.coverPhoto && {
      cover_photo: updateProfileDto.coverPhoto,
    }),
    ...(updateProfileDto.resume && { resume: updateProfileDto.resume }),
    ...(updateProfileDto.headline && { headline: updateProfileDto.headline }),

    ...(updateProfileDto.visibility && {
      visibility: updateProfileDto.visibility,
    }),
  };
}

/**
 * Maps the Profile schema to GetProfileDto.
 */ export function toGetProfileDto(profile: Profile): GetProfileDto {
  return {
    _id: profile._id ?? null,
    firstName: profile.first_name ?? null,
    lastName: profile.last_name ?? null,
    profilePicture: profile.profile_picture ?? null,
    coverPhoto: profile.cover_photo ?? null,
    resume: profile.resume ?? null,
    headline: profile.headline ?? null,
    bio: profile.bio ?? null,
    location: profile.location ?? null,
    industry: profile.industry ?? null,

    skills:
      profile.skills?.map((skill) => ({
        skillName: skill?.skill_name ?? null,
        position: skill?.position ?? null,
        endorsements: skill?.endorsements ?? [],
      })) ?? [],

    education:
      profile.education?.map((education) => ({
        _id: education?._id ?? null,
        school: education?.school ?? null,
        degree: education?.degree ?? null,
        field: education?.field ?? null,
        startDate: education?.start_date?.toISOString() ?? null,
        endDate: education?.end_date?.toISOString() ?? null,
        grade: education?.grade ?? null,
        description: education?.description ?? null,
        companyId: education?.company_id ?? null,
        companyLogo: education?.company_logo ?? null,
      })) ?? [],

    certification:
      profile.certification?.map((cert) => ({
        _id: cert?._id ?? null,
        name: cert?.name ?? null,
        company: cert?.company ?? null,
        companyId: cert?.company_id ?? null,
        companyLogo: cert?.company_logo ?? null,
        issueDate: cert?.issue_date?.toISOString() ?? null,
        expiryDate: cert?.expiry_date?.toISOString() ?? null,
      })) ?? [],

    workExperience:
      profile.work_experience?.map((work) => ({
        _id: work?._id ?? null,
        title: work?.title ?? null,
        companyId: work?.company_id ?? null,
        companyLogo: work?.company_logo ?? null,
        company: work?.company ?? null,
        employmentType: work?.employment_type as EmploymentType,
        startDate: work?.start_date?.toISOString() ?? null,
        endDate: work?.end_date?.toISOString() ?? null,
        location: work?.location ?? null,
        locationType: work?.location_type as LocationType,
        description: work?.description ?? null,
      })) ?? [],

    visibility: profile.visibility as Visibility,
    connectionCount: profile.connection_count ?? 0,
    status: ProfileStatus.ME,
  };
}

/**
 * Maps the EducationDto to the education schema.
 */
export function toCreateEducationSchema(educationDto: Partial<EducationDto>) {
  return {
    _id: new Types.ObjectId(),
    school: educationDto.school,
    degree: educationDto.degree,
    field: educationDto.field,
    start_date: educationDto.startDate,
    end_date: educationDto.endDate,
    grade: educationDto.grade,
    description: educationDto.description,
    company_id: educationDto.companyId,
    company_logo: educationDto.companyLogo,
  };
}

/**
 * Maps the EducationDto to the education schema.
 */
export function toCreateSkillSchema(skillDto: Partial<SkillDto>) {
  return {
    skill_name: skillDto.skillName,
    position: skillDto.position,
    endorsements: [] as Types.ObjectId[],
  };
}

/**
 * Maps the CertificationDto to the Certification schema.
 */
export function toCreateCertificationSchema(
  certificationDto: Partial<CertificationDto>,
) {
  return {
    _id: new Types.ObjectId(),
    name: certificationDto.name,
    company: certificationDto.company,
    issue_date: certificationDto.issueDate,
    company_id: certificationDto.companyId,
    company_logo: certificationDto.companyLogo,
    expiry_date: certificationDto.expiryDate,
  };
}

/**
 * Maps Partial<CertificationDto> to the Certification schema for updates.
 */
export function toUpdateCertificationSchema(
  certificationDto: Partial<CertificationDto>,
): Partial<Certification> {
  return {
    ...(certificationDto.name && { name: certificationDto.name }),
    ...(certificationDto.company && { company: certificationDto.company }),
    ...(certificationDto.issueDate && {
      issue_date: certificationDto.issueDate,
    }),
    ...(certificationDto.companyLogo && {
      company_logo: certificationDto.companyLogo,
    }),
    ...(certificationDto.expiryDate && {
      expiry_date: certificationDto.expiryDate,
    }),
    ...(certificationDto.companyId && {
      company_id: certificationDto.companyId,
    }),
  };
}

/**
 * Maps the WorkExperienceDto to the WorkExperience schema.
 */

export function toCreateWorkExperienceSchema(
  workExperienceDto: Partial<WorkExperienceDto>,
) {
  return {
    _id: new Types.ObjectId(),
    title: workExperienceDto.title,
    company: workExperienceDto.company,
    employment_type: workExperienceDto.employmentType as EmploymentType,
    start_date: workExperienceDto.startDate,
    end_date: workExperienceDto.endDate,
    location: workExperienceDto.location,
    location_type: workExperienceDto.locationType as LocationType,
    description: workExperienceDto.description,
    company_logo: workExperienceDto.companyLogo ?? null,
    company_id: workExperienceDto.companyId ?? null,
  };
}
