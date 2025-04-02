import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './infrastructure/database/schemas/job.schema';
import {
  Application,
  ApplicationSchema,
} from './infrastructure/database/schemas/application.schema';
import {
  CompanyEmployer,
  CompanyEmployerSchema,
} from './infrastructure/database/schemas/company-employer.schema';
import { JobSeeder } from './infrastructure/database/seeders/job.seeder';
import { ApplicationSeeder } from './infrastructure/database/seeders/application.seeder';
import { CompanyEmployerSeeder } from './infrastructure/database/seeders/company-employer.seeder';
import { AuthModule } from '../auth/auth.module';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: CompanyEmployer.name, schema: CompanyEmployerSchema },
    ]),
    AuthModule,
    forwardRef(() => CompaniesModule),
    UsersModule,
    forwardRef(() =>ProfilesModule),
  ],
  exports: [
    MongooseModule,
    JobSeeder,
    ApplicationSeeder,
    CompanyEmployerSeeder,
    JobsService,
  ],
  providers: [JobSeeder, ApplicationSeeder, CompanyEmployerSeeder, JobsService],
})
export class JobsModule {}
