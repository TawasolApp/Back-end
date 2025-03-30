import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Company,
  CompanySchema,
} from './infrastructure/database/schemas/company.schema';
import {
  CompanyConnection,
  CompanyConnectionSchema,
} from './infrastructure/database/schemas/company-connection.schema';
import { CompanySeeder } from './infrastructure/database/seeders/company.seeder';
import { CompanyConnectionSeeder } from './infrastructure/database/seeders/company-connection.seeder';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: CompanyConnection.name, schema: CompanyConnectionSchema },
    ]),
    AuthModule,
  ],
  exports: [MongooseModule, CompanySeeder, CompanyConnectionSeeder],
  providers: [CompanySeeder, CompanyConnectionSeeder],
})
export class CompaniesModule {}
