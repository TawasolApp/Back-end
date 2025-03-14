import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './infrastructure/database/user.schema';
import { UserSeeder } from './infrastructure/database/user.seeder';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  exports: [MongooseModule, UserSeeder], // allows other modules to access user schema if needed
  providers: [UserSeeder]
})
export class AuthModule {}
