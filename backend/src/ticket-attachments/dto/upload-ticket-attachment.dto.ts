import { StorageType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UploadTicketAttachmentDto {
  @IsOptional()
  @IsEnum(StorageType)
  storageType?: StorageType;
}
