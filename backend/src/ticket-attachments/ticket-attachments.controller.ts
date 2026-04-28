import { BadRequestException, Body, Controller, Delete, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { Request } from 'express';
import { AuthenticatedUser, CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UploadTicketAttachmentDto } from './dto/upload-ticket-attachment.dto';
import { TicketAttachmentsService, UploadedTicketFile } from './ticket-attachments.service';

const maxAttachmentSizeBytes = 10 * 1024 * 1024;
const allowedAttachmentMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const allowedAttachmentExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TicketAttachmentsController {
  constructor(private readonly ticketAttachmentsService: TicketAttachmentsService) {}

  @Post('tickets/:ticketId/attachments')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: maxAttachmentSizeBytes },
      fileFilter: (_request, file: UploadedTicketFile, callback) => {
        const extension = extname(file.originalname).toLowerCase();
        if (!allowedAttachmentMimeTypes.has(file.mimetype) || !allowedAttachmentExtensions.has(extension)) {
          callback(new BadRequestException('Only PDF, JPG and PNG files are allowed'), false);
          return;
        }
        callback(null, true);
      },
      storage: diskStorage({
        destination: (request: Request, _file: UploadedTicketFile, callback: (error: Error | null, destination: string) => void) => {
          const ticketId = String(request.params.ticketId);
          if (!/^[A-Za-z0-9_-]+$/.test(ticketId)) {
            callback(new BadRequestException('Invalid ticket id'), '');
            return;
          }
          const destination = join(process.cwd(), 'uploads', 'tickets', ticketId);
          mkdirSync(destination, { recursive: true });
          callback(null, destination);
        },
        filename: (_request: Request, file: UploadedTicketFile, callback: (error: Error | null, filename: string) => void) => {
          const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1_000_000_000)}${extname(file.originalname)}`;
          callback(null, uniqueName);
        }
      })
    })
  )
  uploadAttachment(@Param('ticketId') ticketId: string, @UploadedFile() file: UploadedTicketFile, @Body() dto: UploadTicketAttachmentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketAttachmentsService.uploadAttachment(ticketId, file, dto, user);
  }

  @Get('tickets/:ticketId/attachments')
  findAttachmentsByTicketId(@Param('ticketId') ticketId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketAttachmentsService.findAttachmentsByTicketId(ticketId, user);
  }

  @Delete('ticket-attachments/:id')
  softDeleteAttachment(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketAttachmentsService.softDeleteAttachment(id, user);
  }
}
