import { Job } from '../infrastructure/database/schemas/job.schema';
import { PostJobDto } from '../dtos/post-job.dto';
import { GetJobDto } from '../dtos/get-job.dto';

export function toPostJobSchema(postJobDto: Partial<PostJobDto>): Partial<Job> {
  return {
    position: postJobDto.position,
    salary: postJobDto.salary,
    description: postJobDto.description,
    experience_level: postJobDto.experienceLevel,
    employment_type: postJobDto.employmentType,
    location_type: postJobDto.locationType,
    location: postJobDto.location,
    application_link: postJobDto.applicationLink,
  };
}

export function toGetJobDto(job: Partial<Job>): GetJobDto {
  const dto: Partial<GetJobDto> = {};

  if (job._id) dto.jobId = job._id.toString();
  if (job.company_id) dto.companyId = job.company_id.toString();
  if (job.position) dto.position = job.position;
  if (job.description) dto.description = job.description;
  if (job.experience_level) dto.experienceLevel = job.experience_level;
  if (job.employment_type) dto.employmentType = job.employment_type;
  if (job.location_type) dto.locationType = job.location_type;
  if (job.location) dto.location = job.location;
  if (job.application_link) dto.applicationLink = job.application_link;
  if (job.applicants != undefined) dto.applicants = job.applicants;
  if (job.open !== undefined) dto.isOpen = job.open;
  if (job.posted_at) dto.postedAt = job.posted_at;

  return dto as GetJobDto;
}
