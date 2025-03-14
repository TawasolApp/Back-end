import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from './infrastructure/database/profile.schema';
import { ProfileSeeder } from './infrastructure/database/profile.seeder';

@Module({
  imports: [MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }])],
  exports: [MongooseModule, ProfileSeeder],
  providers: [ProfileSeeder]
})
export class ProfilesModule {}
