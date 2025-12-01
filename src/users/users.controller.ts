import { Controller, Post, Get, UseInterceptors, UploadedFile, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.findById(user.id);
  }

  @Post('verify-identity')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/id-documents',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      // Accept images and PDFs only
      if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf)$/)) {
        return cb(new BadRequestException('Only image files (jpg, jpeg, png) and PDF are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
  }))
  async verifyIdentity(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const user = req.user as any;
    const filePath = file.path;

    await this.usersService.updateVerificationStatus(user.id, filePath);

    return {
      message: 'Identity verified successfully',
      isVerified: true,
    };
  }
}
