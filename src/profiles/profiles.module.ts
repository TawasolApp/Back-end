import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Profile,
  ProfileSchema,
} from './infrastructure/database/profile.schema';
import { ProfileSeeder } from './infrastructure/database/profile.seeder';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    AuthModule,
  ],
  providers: [ProfileSeeder],
  exports: [ProfileSeeder],
})
export class ProfilesModule {}
