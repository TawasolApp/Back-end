import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
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
import { JobsController } from './jobs.controller';
import { NotificationGateway } from '../gateway/notification.gateway';
import {
  Notification,
  NotificationSchema,
} from '../notifications/infrastructure/database/schemas/notification.schema';
import {
  PlanDetail,
  PlanDetailSchema,
} from '../payments/infrastructure/database/schemas/plan-detail.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: CompanyEmployer.name, schema: CompanyEmployerSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: PlanDetail.name, schema: PlanDetailSchema },
    ]),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
    AuthModule,
    forwardRef(() => CompaniesModule),
    UsersModule,
    forwardRef(() => ProfilesModule),
  ],
  controllers: [JobsController],
  exports: [
    MongooseModule,
    JobSeeder,
    ApplicationSeeder,
    CompanyEmployerSeeder,
    JobsService,
  ],
  providers: [
    JobSeeder,
    ApplicationSeeder,
    CompanyEmployerSeeder,
    JobsService,
    NotificationGateway,
  ],
})
export class JobsModule {}
