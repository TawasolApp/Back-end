import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';
import {
  Report,
  ReportSchema,
} from '../admin/infrastructure/database/schemas/report.schema';
import {
  Job,
  JobSchema,
} from '../jobs/infrastructure/database/schemas/job.schema';
import {
  Profile,
  ProfileSchema,
} from '../profiles/infrastructure/database/schemas/profile.schema';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Job.name, schema: JobSchema },
      { name: Profile.name, schema: ProfileSchema },
    ]),
    AuthModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [SecurityController],
  providers: [SecurityService],
})
export class SecurityModule {}
