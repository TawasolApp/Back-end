import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Profile,
  ProfileSchema,
} from './infrastructure/database/schemas/profile.schema';
import { ProfileSeeder } from './infrastructure/database/seeders/profile.seeder';
import { AuthModule } from '../auth/auth.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { ConnectionsModule } from '../connections/connections.module';
import {
  User,
  UserSchema,
} from '../users/infrastructure/database/schemas/user.schema';
import { CompaniesModule } from '../companies/companies.module';
import { PostsService } from '../posts/posts.service';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    UsersModule,
    ConnectionsModule,
    PostsModule,
    UsersModule,
    forwardRef(() => CompaniesModule),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [ProfileSeeder, ProfilesService],
  exports: [ProfileSeeder, MongooseModule],
  controllers: [ProfilesController],
})
export class ProfilesModule {}
