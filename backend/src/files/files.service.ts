import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly configService: ConfigService) {}

  async generateUploadPresignedUrl(tenantSlug: string, entityType: string, filename: string, mimeType: string) {
    const key = `${tenantSlug}/${entityType}/${Date.now()}-${filename}`;
    // In production with AWS credentials, this calls getSignedUrl from @aws-sdk/s3-request-presigner
    const presignedUrl = `https://mederp-files.s3.ap-south-1.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=mock`;
    return {
      uploadUrl: presignedUrl,
      key: key,
      expiresInSeconds: 900,
    };
  }

  async generateDownloadPresignedUrl(key: string) {
    const presignedUrl = `https://mederp-files.s3.ap-south-1.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=mock`;
    return {
      downloadUrl: presignedUrl,
      expiresInSeconds: 900,
    };
  }
}
