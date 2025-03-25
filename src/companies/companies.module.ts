import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: CompanyConnection.name, schema: CompanyConnectionSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  exports: [MongooseModule, CompanySeeder, CompanyConnectionSeeder],
  providers: [CompanySeeder, CompanyConnectionSeeder],
})
export class CompaniesModule {}
