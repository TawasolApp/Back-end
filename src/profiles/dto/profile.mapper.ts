import { Types } from 'mongoose';
import { Certification, Education, Profile } from '../infrastructure/database/schemas/profile.schema';
import { CreateProfileDto } from './create-profile.dto';
import { GetProfileDto } from './get-profile.dto';
import { UpdateProfileDto } from './update-profile.dto';
import { EducationDto } from './education.dto';
import { SkillDto } from './skill.dto';
import { CertificationDto } from './certification.dto';
import { WorkExperienceDto } from './work-experience.dto';
import { Gender, ProfileStatus, Visibility, EmploymentType, LocationType, PlanType } from '../infrastructure/database/enums/profile-enums';

/**
 * Maps CreateProfileDto to the Profile schema.
 */
export function toCreateProfileSchema(
  id: Types.ObjectId,
  createProfileDto: Partial<CreateProfileDto>,
) {
  return {
    _id: new Types.ObjectId(id),
    name: createProfileDto.name,
    profile_picture: createProfileDto.profilePicture,
    cover_photo: createProfileDto.coverPhoto,
    resume: createProfileDto.resume,
    headline: createProfileDto.headline,
    bio: createProfileDto.bio,
    location: createProfileDto.location,
    industry: createProfileDto.industry,

    skills: createProfileDto.skills?.map((skillDto) => ({
      skill_name: skillDto.skillName,
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
      })) ?? [],

    certification:
      createProfileDto.certification?.map((cert) => ({
        name: cert?.name ?? null,
        company: cert?.company ?? null,
        issue_date: cert?.issueDate ? new Date(cert.issueDate) : new Date(),
      })) ?? [],

    work_experience:
      createProfileDto.workExperience?.map((work) => ({
        title: work.title,
        company: work.company,
        employment_type: work.employmentType as EmploymentType,
        start_date: work.startDate ? new Date(work.startDate) : new Date(),
        end_date: work.endDate ? new Date(work.endDate) : new Date(),
        location: work.location ?? '', // ✅ Ensure `location` is always a string
        location_type: work.locationType as LocationType, // ✅ Ensure `location_type` is always a string
        description: work.description ?? '',
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
    ...(updateProfileDto.name && { name: updateProfileDto.name }),
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
    name: profile.name ?? null,
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
        endorsements: skill?.endorsements ?? [],
      })) ?? [],

    education:
      profile.education?.map((education) => ({
        _id: education?._id ?? null,
        school: education?.school ?? null,
        degree: education?.degree ?? null,
        field: education?.field ?? null,
        startDate: education?.start_date?.toISOString() ?? null,
        endDate: education?.end_date?.toISOString() ?? undefined,
        grade: education?.grade ?? null,
        description: education?.description ?? null,
      })) ?? [],

    certification:
      profile.certification?.map((cert) => ({
        _id: cert?._id ?? null,
        name: cert?.name ?? null,
        company: cert?.company ?? null,
        issueDate: cert?.issue_date ?? null,
      })) ?? [],

    workExperience:
      profile.work_experience?.map((work) => ({
        _id: work?._id ?? null,
        title: work?.title ?? null,
        company: work?.company ?? null,
        employmentType: work?.employment_type as EmploymentType,
        startDate: work?.start_date?.toISOString() ?? null,
        endDate: work?.end_date?.toISOString() ?? undefined,
        location: work?.location ?? null,
        locationType: work?.location_type as LocationType,
        description: work?.description ?? null,
      })) ?? [],

    visibility: profile.visibility as Visibility, // Defaulting to 'public'
    connectionCount: profile.connection_count ?? 0, // Defaulting to 0
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
  };
}

/**
 * Maps Partial<EducationDto> to the education schema for updates.
 */
export function toUpdateEducationSchema(
  educationDto: Partial<EducationDto>
): Partial<Education> {
  return {
    ...(educationDto.school && { school: educationDto.school }),
    ...(educationDto.degree && { degree: educationDto.degree }),
    ...(educationDto.field && { field: educationDto.field }),
    ...(educationDto.startDate && { start_date: educationDto.startDate }),
    ...(educationDto.endDate && { end_date: educationDto.endDate }),
    ...(educationDto.grade && { grade: educationDto.grade }),
    ...(educationDto.description && { description: educationDto.description }),
  };
}


/**
 * Maps the EducationDto to the education schema.
 */
export function toCreateSkillSchema(skillDto: Partial<SkillDto>) {
  return {
    skill_name: skillDto.skillName,
    endorsements: [] as Types.ObjectId[],

  };
}


/**
 * Maps the CertificationDto to the Certification schema.
 */
export function toCreateCertificationSchema(
  certificationDto: Partial<CertificationDto>,) {
  return {
    _id: new Types.ObjectId(),
    name: certificationDto.name,
    company: certificationDto.company,
    issue_date: certificationDto.issueDate,
  };
}

/**
 * Maps Partial<CertificationDto> to the Certification schema for updates.
 */
export function toUpdateCertificationSchema(
  certificationDto: Partial<CertificationDto>
): Partial<Certification> {
  return {
    ...(certificationDto.name && { name: certificationDto.name }),
    ...(certificationDto.company && { company: certificationDto.company }),
    ...(certificationDto.issueDate && { issue_date: certificationDto.issueDate }),
  };
}


/**
 * Maps the WorkExperienceDto to the WorkExperience schema.
 */

export function toCreateWorkExperienceSchema(workExperienceDto: Partial<WorkExperienceDto>) {
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
  };
}