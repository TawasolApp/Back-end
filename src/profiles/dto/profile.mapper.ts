import { Profile } from '../infrastructure/database/profile.schema';
import { CreateProfileDto } from './create-profile.dto';
import { GetProfileDto } from './get-profile.dto';

import { UpdateProfileDto } from './update-profile.dto';

/**
 * Maps CreateProfileDto to the Profile schema.
 */
export function toCreateProfileSchema(
  createProfileDto: Partial<CreateProfileDto>,
): Partial<Profile> {
  return {
    name: createProfileDto.name,
    bio: createProfileDto.bio,
    location: createProfileDto.location,
    industry: createProfileDto.industry,
    profile_picture: createProfileDto.profilePicture,
    cover_photo: createProfileDto.coverPhoto,
    skills: createProfileDto.skills?.map(skillDto => ({
      skill_name: skillDto.skillName,
      endorsements: skillDto.endorsements || [],
    })),
    visibility: createProfileDto.visibility,
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
      ...(updateProfileDto.profilePicture && { profile_picture: updateProfileDto.profilePicture }),
      ...(updateProfileDto.coverPhoto && { cover_photo: updateProfileDto.coverPhoto }),
     
      ...(updateProfileDto.visibility && { visibility: updateProfileDto.visibility }),
    };
  }

/**
 * Maps the Profile schema to GetProfileDto.
 */export function toGetProfileDto(profile: Profile): GetProfileDto {
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

    skills: profile.skills?.map(skill => ({
      skillName: skill?.skill_name ?? null,
      endorsements: skill?.endorsements ?? [],
    })) ?? [],

    education: profile.education?.map(education => ({
        _id: education?._id ?? null,
      school: education?.school ?? null,
      degree: education?.degree ?? null,
      field: education?.field ?? null,
      startDate: education?.start_date?.toISOString() ?? null,
      endDate: education?.end_date?.toISOString() ?? undefined,
      grade: education?.grade ?? null,
      description: education?.description ?? null,
    })) ?? [],

    certifications: profile.certification?.map(cert => ({
      name: cert?.name ?? null,
      company: cert?.company ?? null,
      issueDate: cert?.issue_date?.toISOString() ?? null,
    })) ?? [],

    workExperience: profile.work_experience?.map(work => ({
      _id: work?._id ?? null,
      title: work?.title ?? null,
      company: work?.company ?? null,
      employmentType: work?.employment_type ?? null,
      startDate: work?.start_date?.toISOString() ?? null,
      endDate: work?.end_date?.toISOString() ?? undefined,
      location: work?.location ?? null,
      locationType: work?.location_type ?? null,
      description: work?.description ?? null,
    })) ?? [],

    visibility: profile.visibility ?? 'public', // Defaulting to 'public'
    connectionCount: profile.connection_count ?? 0, // Defaulting to 0
  };
}