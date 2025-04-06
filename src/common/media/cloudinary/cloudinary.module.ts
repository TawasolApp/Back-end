import { Module } from '@nestjs/common';
import { configureCloudinary } from './cloudinary.config';

@Module({
  providers: [
    {
      provide: 'CLOUDINARY',
      useFactory: configureCloudinary,
    },
  ],
  exports: ['CLOUDINARY'],
})
export class CloudinaryModule {}
