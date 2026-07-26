import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Tenant } from '../common/decorators/tenant.decorator';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('presign/upload')
  async getUploadUrl(
    @Tenant() tenantSlug: string,
    @Body('entityType') entityType: string,
    @Body('filename') filename: string,
    @Body('mimeType') mimeType: string,
  ) {
    return this.filesService.generateUploadPresignedUrl(tenantSlug, entityType || 'documents', filename, mimeType);
  }

  @Get('presign/download/*')
  async getDownloadUrl(@Param('0') key: string) {
    return this.filesService.generateDownloadPresignedUrl(key);
  }
}
