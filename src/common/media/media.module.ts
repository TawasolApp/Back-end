import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService], 
})
export class MediaModule {}
