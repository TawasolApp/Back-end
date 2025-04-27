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

  private buildMediaUrl(
    uploadResult: UploadApiResponse,
    mediaType: string,
  ): string {
    const baseUrl = this.buildCloudinaryUrl(uploadResult);
    if (mediaType === 'document') {
      const encodedUrl = encodeURIComponent(baseUrl);
      return `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
    }
    return baseUrl;
  }

  async uploadFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; type: string }> {
    const mime = file.mimetype;
    const ext = extname(file.originalname).replace('.', '').toLowerCase();

    let resourceType: 'image' | 'video' | 'raw' = 'raw';
    if (mime.startsWith('image/')) resourceType = 'image';
    else if (mime.startsWith('video/')) resourceType = 'video';
    else if (ext === 'pdf') resourceType = 'raw';

    const publicId = file.originalname.replace(/\.[^/.]+$/, '');

    const uploadResult: UploadApiResponse = await new Promise(
      (resolve, reject) => {
        const uploadStream = this.cloudinary.uploader.upload_stream(
          {
            resource_type: resourceType,
            public_id: `uploads/${publicId}`,
            format: ext,
          },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result);
          },
        );

        const stream = Readable.from(file.buffer);
        stream.pipe(uploadStream);
      },
    );

    const mediaType = this.detectMediaType(resourceType, uploadResult.format);
    const url = this.buildMediaUrl(uploadResult, mediaType);

    return {
      url,
      type: mediaType,
    };
  }

  private detectMediaType(resourceType: string, format?: string): string {
    if (format && format.toLowerCase() === 'pdf') return 'document';
    if (resourceType === 'video') return 'video';
    if (
      format &&
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format.toLowerCase())
    )
      return 'image';
    return 'file';
  }

  private buildCloudinaryUrl(uploadResult: UploadApiResponse): string {
    const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`;
    const path = `${uploadResult.resource_type}/upload`;
    const version = `v${uploadResult.version}`;
    const file = `${uploadResult.public_id}.${uploadResult.format}`;

    return `${base}/${path}/${version}/${file}`;
  }
}
