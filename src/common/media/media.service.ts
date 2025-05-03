import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';
import { extname } from 'path';

type CloudinaryType = typeof cloudinary;

@Injectable()
export class MediaService {
  constructor(
    @Inject('CLOUDINARY') private readonly cloudinary: CloudinaryType,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; type: string }> {
    const mime = file.mimetype;
    const ext = extname(file.originalname).replace('.', '');

    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    if (mime.startsWith('image/')) resourceType = 'image';
    else if (mime.startsWith('video/')) resourceType = 'video';
    else if (ext === 'pdf') resourceType = 'raw';

    const publicId = file.originalname.replace(/\.[^/.]+$/, '');

    const uploadResult: UploadApiResponse = await new Promise(
      (resolve, reject) => {
        this.cloudinary.uploader
          .upload_stream(
            {
              resource_type: resourceType,
              public_id: `uploads/${publicId}`,
            },
            (error, result) => {
              if (error || !result) return reject(error);
              resolve(result);
            },
          )
          .end(file.buffer);
      },
    );

    const mediaType = this.detectMediaType(resourceType, uploadResult.format);
    const url = this.buildCloudinaryUrl(uploadResult);

    return {
      url: url,
      type: mediaType,
    };
  }

  private detectMediaType(resourceType: string, format?: string): string {
    if (resourceType === 'video') return 'video';
    if (
      format &&
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format.toLowerCase())
    )
      return 'image';
    if (format && format.toLowerCase() === 'pdf') return 'document';
    return 'file';
  }

  private buildCloudinaryUrl(uploadResult: UploadApiResponse): string {
    const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
    const path = `${uploadResult.resource_type}/upload`;
    const version = `v${uploadResult.version}`;
    const file = `${uploadResult.public_id}${uploadResult.format ? '.' + uploadResult.format : '.pdf'}`;
    return `${base}/${path}/${version}/${file}`;
  }
}
