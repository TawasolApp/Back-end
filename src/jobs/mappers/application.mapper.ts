import { Application } from '../infrastructure/database/schemas/application.schema';
import { ApplicationDto } from '../dtos/application.dto';
import { ApplicationStatus } from '../enums/application-status.enum';

export function toApplicationDto(
  application: Partial<Application>,
): ApplicationDto {
  return {
    applicationId: application._id?.toString() ?? '',
    applicantId: application.user_id?.toString() ?? '',
    applicantName:
      application['profile']?.first_name && application['profile']?.last_name
        ? `${application['profile'].first_name} ${application['profile'].last_name}`
        : undefined,
    applicantEmail: application['profile']?.email || undefined,
    applicantPicture: application['profile']?.profile_picture || undefined,
    applicantHeadline: application['profile']?.headline || undefined,
    applicantPhoneNumber: application.phone_number || undefined,
    resumeURL: application.resume_url || undefined,
    status: application.status ?? ApplicationStatus.Pending,
    appliedDate: application.applied_at ?? '',
  };
}
