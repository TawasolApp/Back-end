import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

type CloudinaryType = typeof cloudinary;

@Injectable()
export class MediaService {
  constructor(
    @Inject('CLOUDINARY') private readonly cloudinary: CloudinaryType,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; type: string }> {
    const base64Str = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64Str}`;

    const mime = file.mimetype;
    let resourceType: 'image' | 'video' | 'raw' = 'raw'; 

    if (mime.startsWith('image/')) resourceType = 'image';
    else if (mime.startsWith('video/')) resourceType = 'video';

    const uploadResult: UploadApiResponse =
      await this.cloudinary.uploader.upload(dataUri, {
        resource_type: resourceType,
      });

    const mediaType = this.detectMediaType(resourceType, uploadResult.format);
    const url = this.buildCloudinaryUrl(uploadResult);

    return {
      url,
      type: mediaType,
    };
  }

  private detectMediaType(resourceType: string, format?: string): string {
    if (resourceType === 'video') return 'video';
    if (
      format &&
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format.toLowerCase())
    ) {
      return 'image';
    }
    return 'document';
  }

  private buildCloudinaryUrl(uploadResult: UploadApiResponse): string {
    const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
    const path = `${uploadResult.resource_type}/upload`;
    const version = `v${uploadResult.version}`;
    const file = `${uploadResult.public_id}.${uploadResult.format}`;

    return `${base}/${path}/${version}/${file}`;
  }
}
