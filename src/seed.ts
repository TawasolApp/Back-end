import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserSeeder } from './users/infrastructure/database/user.seeder';
import { UserConnectionSeeder } from './connections/infrastructure/database/user-connection.seeder';
import { CompanySeeder } from './companies/infrastructure/database/company.seeder';
import { CompanyConnectionSeeder } from './companies/infrastructure/database/company-connection.seeder';
import { ProfileSeeder } from './profiles/infrastructure/database/profile.seeder';
import { PostSeeder } from './posts/infrastructure/database/post.seeder';
import { CommentSeeder } from './posts/infrastructure/database/comment.seeder';
import { ReactSeeder } from './posts/infrastructure/database/react.seeder';
import { SaveSeeder } from './posts/infrastructure/database/save.seeder';
import { ShareSeeder } from './posts/infrastructure/database/share.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userSeeder = app.get(UserSeeder);
  const userConnectionSeeder = app.get(UserConnectionSeeder);
  const companySeeder = app.get(CompanySeeder);
  const companyConnectionSeeder = app.get(CompanyConnectionSeeder);
  const profileSeeder = app.get(ProfileSeeder);
  const postSeeder = app.get(PostSeeder);
  const commentSeeder = app.get(CommentSeeder);
  const reactSeeder = app.get(ReactSeeder);
  const saveSeeder = app.get(SaveSeeder);
  const shareSeeder = app.get(ShareSeeder);

  await userSeeder.clearUsers();
  await userSeeder.seedUsers(15);
  await profileSeeder.clearProfiles();
  await profileSeeder.seedProfiles(10);
  await userConnectionSeeder.clearUserConnections();
  await userConnectionSeeder.seedUserConnections(5);
  await companySeeder.clearCompanies();
  await companySeeder.seedCompanies(10);
  await companyConnectionSeeder.clearCompanyConnections();
  await companyConnectionSeeder.seedCompanyConnections(5);
  // await postSeeder.clearPosts();
  // await postSeeder.seedPosts(10);
  // await commentSeeder.clearComments();
  // await commentSeeder.seedComments(15);
  // await reactSeeder.clearReacts();
  // await reactSeeder.seedReacts(20);
  // await saveSeeder.clearSaves();
  // await saveSeeder.seedSaves(5);
  // await shareSeeder.clearShares();
  // await shareSeeder.seedShares(5);

  await app.close();
}

bootstrap();
