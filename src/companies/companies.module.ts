import { forwardRef, Module, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { APP_PIPE } from '@nestjs/core';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import {
  Company,
  CompanySchema,
} from './infrastructure/database/schemas/company.schema';
import {
  CompanyConnection,
  CompanyConnectionSchema,
} from './infrastructure/database/schemas/company-connection.schema';
import {
  CompanyManager,
  CompanyManagerSchema,
} from './infrastructure/database/schemas/company-manager.schema';
import { CompanySeeder } from './infrastructure/database/seeders/company.seeder';
import { CompanyConnectionSeeder } from './infrastructure/database/seeders/company-connection.seeder';
import { CompanyManagerSeeder } from './infrastructure/database/seeders/company-manager.seeder';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { ConnectionsModule } from '../connections/connections.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: CompanyConnection.name, schema: CompanyConnectionSchema },
      { name: CompanyManager.name, schema: CompanyManagerSchema },
    ]),
    AuthModule,
    UsersModule,
    forwardRef(() => ProfilesModule),
    forwardRef(() => ConnectionsModule),
    forwardRef(() => JobsModule),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [
    MongooseModule,
    CompanySeeder,
    CompanyConnectionSeeder,
    CompanyManagerSeeder,
    CompaniesService,
  ],
  providers: [
    CompanySeeder,
    CompanyConnectionSeeder,
    CompanyManagerSeeder,
    CompaniesService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  controllers: [CompaniesController],
})
export class CompaniesModule {}
