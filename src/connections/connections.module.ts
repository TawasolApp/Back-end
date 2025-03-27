import { forwardRef, Module, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserConnection,
  UserConnectionSchema,
} from './infrastructure/database/user-connection.schema';
import { UserConnectionSeeder } from './infrastructure/database/user-connection.seeder';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import { JwtModule } from '@nestjs/jwt';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserConnection.name, schema: UserConnectionSchema },
    ]),
    AuthModule,
    UsersModule,
    AuthModule,
    forwardRef(() => ProfilesModule),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default_secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [MongooseModule, UserConnectionSeeder], // allows other modules to access user schema if needed
  providers: [
    UserConnectionSeeder,
    ConnectionsService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
  controllers: [ConnectionsController],
})
export class ConnectionsModule {}
