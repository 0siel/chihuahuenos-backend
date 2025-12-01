import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  uploadFile(file: Express.Multer.File) {
    // In a real app, you might upload to S3 or similar.
    // Here we just return the file info as confirmation.
    return {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }
}
