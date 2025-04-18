import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserSeeder } from './users/infrastructure/database/seeders/user.seeder';
import { UserConnectionSeeder } from './connections/infrastructure/database/seeders/user-connection.seeder';
import { CompanySeeder } from './companies/infrastructure/database/seeders/company.seeder';
import { CompanyConnectionSeeder } from './companies/infrastructure/database/seeders/company-connection.seeder';
import { ProfileSeeder } from './profiles/infrastructure/database/seeders/profile.seeder';
import { PostSeeder } from './posts/infrastructure/database/seeders/post.seeder';
import { CommentSeeder } from './posts/infrastructure/database/seeders/comment.seeder';
import { ReactSeeder } from './posts/infrastructure/database/seeders/react.seeder';
import { SaveSeeder } from './posts/infrastructure/database/seeders/save.seeder';
import { ShareSeeder } from './posts/infrastructure/database/seeders/share.seeder';
import { JobSeeder } from './jobs/infrastructure/database/seeders/job.seeder';
import { ApplicationSeeder } from './jobs/infrastructure/database/seeders/application.seeder';
import { CompanyManagerSeeder } from './companies/infrastructure/database/seeders/company-manager.seeder';
import { CompanyEmployerSeeder } from './jobs/infrastructure/database/seeders/company-employer.seeder';
import { ReportSeeder } from './admin/infrastructure/database/seeders/report.seeder';
import { faker } from '@faker-js/faker';
import { ConversationSeeder } from './messages/infrastructure/database/seeders/conversation.seeder';
import { MessageSeeder } from './messages/infrastructure/database/seeders/message.seeder';

faker.seed(5050);
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userSeeder = app.get(UserSeeder);
  const userConnectionSeeder = app.get(UserConnectionSeeder);
  const companySeeder = app.get(CompanySeeder);
  const companyConnectionSeeder = app.get(CompanyConnectionSeeder);
  const companyManagerSeeder = app.get(CompanyManagerSeeder);
  const profileSeeder = app.get(ProfileSeeder);
  const postSeeder = app.get(PostSeeder);
  const commentSeeder = app.get(CommentSeeder);
  const reactSeeder = app.get(ReactSeeder);
  const saveSeeder = app.get(SaveSeeder);
  const shareSeeder = app.get(ShareSeeder);
  const jobSeeder = app.get(JobSeeder);
  const applicationSeeder = app.get(ApplicationSeeder);
  const companyEmployerSeeder = app.get(CompanyEmployerSeeder);
  const reportSeeder = app.get(ReportSeeder);
  const conversationSeeder = app.get(ConversationSeeder);
  const messageSeeder = app.get(MessageSeeder);

  // await userSeeder.clearUsers();
  // await userSeeder.seedUsers(30);
  // await companySeeder.clearCompanies();
  // await companySeeder.seedCompanies(20);
  // await profileSeeder.clearProfiles();
  // await profileSeeder.seedProfiles();

  // await userConnectionSeeder.clearUserConnections();
  // await userConnectionSeeder.seedUserConnections(100);
  // await profileSeeder.updateConnectionCounts();

  // await companyConnectionSeeder.clearCompanyConnections();
  // await companyConnectionSeeder.seedCompanyConnections(70);
  // await companySeeder.updateFollowerCounts();
  // await companyManagerSeeder.clearCompanyManagers();
  // await companyManagerSeeder.seedCompanyManagers(10);
  // await jobSeeder.clearJobs();
  // await jobSeeder.seedJobs(30);
  // await applicationSeeder.clearApplications();
  // await applicationSeeder.seedApplications(60);
  // await jobSeeder.updateApplicantCounts();
  // await companyEmployerSeeder.clearCompanyEmployers();
  // await companyEmployerSeeder.seedCompanyEmployers(10);

  // await postSeeder.clearPosts();
  // await postSeeder.clearPosts();
  // await postSeeder.seedPosts(50);
  // await postSeeder.seedReposts(20);
  // await commentSeeder.clearComments();
  // await commentSeeder.seedComments(70);
  // await commentSeeder.seedReplies(30);
  // await reactSeeder.clearReacts();
  // await reactSeeder.seedReacts(150);
  // await reactSeeder.seedCommentReacts(150);
  // await saveSeeder.clearSaves();
  // await saveSeeder.seedSaves(15);
  // await shareSeeder.clearShares();
  // await shareSeeder.seedShares(10);
  // await postSeeder.updatePostCounts();
  // await commentSeeder.updateCommentReactCounts();
  // await postSeeder.updateCommentCounts();
  // await commentSeeder.updateCommentReplies();
  // await postSeeder.updateShareCounts();

  await reportSeeder.clearReports();
  await reportSeeder.seedReports(15);

  await conversationSeeder.clearConversations();
  await conversationSeeder.seedConversations(5);

  await messageSeeder.clearMessages();
  await messageSeeder.seedMessages(10);

  await app.close();
}

bootstrap();
