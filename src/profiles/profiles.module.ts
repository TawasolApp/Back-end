import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Profile,
  ProfileSchema,
} from './infrastructure/database/profile.schema';
import { ProfileSeeder } from './infrastructure/database/profile.seeder';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ConnectionsModule } from '../connections/connections.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
    AuthModule,
    UsersModule,
    ConnectionsModule,
  ],
  providers: [ProfileSeeder],
  exports: [MongooseModule, ProfileSeeder],
})
export class ProfilesModule {}
