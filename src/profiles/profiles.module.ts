import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Profile,
  ProfileSchema,
} from './infrastructure/database/profile.schema';
import { ProfileSeeder } from './infrastructure/database/profile.seeder';
import { AuthModule } from '../auth/auth.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    AuthModule,
  ],
  providers: [ProfileSeeder, ProfilesService],
  exports: [ProfileSeeder],
  controllers: [ProfilesController],
})
export class ProfilesModule {}
