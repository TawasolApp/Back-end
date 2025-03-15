import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserSeeder } from './auth/infrastructure/database/user.seeder';
import { ProfileSeeder } from './profiles/infrastructure/database/profile.seeder';
import { PostSeeder } from './posts/infrastructure/database/post.seeder'; 

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userSeeder = app.get(UserSeeder);
  const profileSeeder = app.get(ProfileSeeder);
  const postSeeder = app.get(PostSeeder); // Add this line
  
  await userSeeder.clearUsers();
  await userSeeder.seedUsers(10);
  await profileSeeder.clearProfiles();
  await profileSeeder.seedProfiles(10);
  await postSeeder.clearPosts(); // Add this line
  await postSeeder.seedPosts(10); // Add this line

  await app.close();
}

bootstrap();
