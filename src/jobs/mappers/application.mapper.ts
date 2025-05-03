import { Application } from '../infrastructure/database/schemas/application.schema';
import { ApplicationDto } from '../dtos/application.dto';

export function toApplicationDto(
  application: Partial<Application>,
): ApplicationDto {
  const dto: Partial<ApplicationDto> = {};

  if (application._id) dto.applicationId = application._id.toString();
  if (application.user_id) dto.applicantId = application.user_id.toString();
  if (application.phone_number)
    dto.applicantPhoneNumber = application.phone_number;
  if (application.resume_url) dto.resumeURL = application.resume_url;
  if (application.status) dto.status = application.status;
  if (application.applied_at) dto.appliedDate = application.applied_at;

  dto.applicantName = undefined;
  dto.applicantEmail = undefined;
  dto.applicantPicture = undefined;
  dto.applicantHeadline = undefined;

  return dto as ApplicationDto;
}
