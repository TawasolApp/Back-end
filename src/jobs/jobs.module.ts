import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './infrastructure/database/schemas/job.schema';
import {
  Application,
  ApplicationSchema,
} from './infrastructure/database/schemas/application.schema';
import { JobSeeder } from './infrastructure/database/seeders/job.seeder';
import { ApplicationSeeder } from './infrastructure/database/seeders/application.seeder';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
    AuthModule,
    CompaniesModule,
    UsersModule,
  ],
  exports: [MongooseModule, JobSeeder, ApplicationSeeder],
  providers: [JobSeeder, ApplicationSeeder],
})
export class JobsModule {}
