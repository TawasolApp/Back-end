import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserConnection,
  UserConnectionSchema,
} from './infrastructure/database/schemas/user-connection.schema';
import { UserConnectionSeeder } from './infrastructure/database/seeders/user-connection.seeder';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserConnection.name, schema: UserConnectionSchema },
    ]),
    AuthModule,
  ],
  exports: [MongooseModule, UserConnectionSeeder], // allows other modules to access user schema if needed
  providers: [UserConnectionSeeder],
})
export class ConnectionsModule {}
