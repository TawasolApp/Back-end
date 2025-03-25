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
import { User, UserSchema } from '../users/infrastructure/database/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    UsersModule,
    ConnectionsModule,
  ],
  providers: [ProfileSeeder],
  exports: [MongooseModule, ProfileSeeder],
})
export class ProfilesModule {}
