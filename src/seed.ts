import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UserSeeder } from './auth/infrastructure/database/user.seeder';
import { ProfileSeeder } from './profiles/infrastructure/database/profile.seeder';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userSeeder = app.get(UserSeeder);
  const profileSeeder = app.get(ProfileSeeder);
  
  await userSeeder.clearUsers();
  await userSeeder.seedUsers(10);
  await profileSeeder.clearProfiles();
  await profileSeeder.seedProfiles(10);

  await app.close();
}

bootstrap();
