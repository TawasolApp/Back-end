import { Module } from '@nestjs/common';
import { SecurityController } from './security.controller';
import { SecurityService } from './security.service';

@Module({
  controllers: [SecurityController],
  providers: [SecurityService]
})
export class SecurityModule {}
