import { forwardRef, Module, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { APP_PIPE } from '@nestjs/core';
import { ConnectionsController } from './connections.controller';
import { ConnectionsService } from './connections.service';
import {
  UserConnection,
  UserConnectionSchema,
} from './infrastructure/database/schemas/user-connection.schema';
import { UserConnectionSeeder } from './infrastructure/database/seeders/user-connection.seeder';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ProfilesModule } from '../profiles/profiles.module';
import { NotificationGateway } from '../gateway/notification.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { CompaniesModule } from '../companies/companies.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserConnection.name, schema: UserConnectionSchema },
    ]),
    AuthModule,
    UsersModule,
    AuthModule,
    forwardRef(() => ProfilesModule),
    NotificationsModule,
    forwardRef(() => CompaniesModule),
    JwtModule.register({
      secret:
        process.env.JWT_SECRET ||
        '4a52519e47d98ddd4b515a71ca31443d530b16bd48218cacd2805ea7d0cdc5d4',
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
    NotificationGateway,
  ],
  controllers: [ConnectionsController],
})
export class ConnectionsModule {}
