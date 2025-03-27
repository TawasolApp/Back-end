import { Module, ValidationPipe } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_PIPE } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Company,
  CompanySchema,
} from './infrastructure/database/company.schema';
import {
  CompanyConnection,
  CompanyConnectionSchema,
} from './infrastructure/database/company-connection.schema';
import { CompanySeeder } from './infrastructure/database/company.seeder';
import { CompanyConnectionSeeder } from './infrastructure/database/company-connection.seeder';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { ConnectionsModule } from '../connections/connections.module';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: CompanyConnection.name, schema: CompanyConnectionSchema },
    ]),
    AuthModule,
    UsersModule,
    ProfilesModule,
    ConnectionsModule,
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [MongooseModule, CompanySeeder, CompanyConnectionSeeder],
  providers: [
    CompanySeeder,
    CompanyConnectionSeeder,
    CompaniesService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  controllers: [CompaniesController],
})
export class CompaniesModule {}
