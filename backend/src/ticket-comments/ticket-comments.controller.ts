import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { UpdateTicketCommentDto } from './dto/update-ticket-comment.dto';
import { TicketCommentsService } from './ticket-comments.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TicketCommentsController {
  constructor(private readonly ticketCommentsService: TicketCommentsService) {}

  @Post('tickets/:ticketId/comments')
  createTicketComment(@Param('ticketId') ticketId: string, @Body() dto: CreateTicketCommentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketCommentsService.createComment(ticketId, dto, user);
  }

  @Get('tickets/:ticketId/comments')
  findCommentsByTicketId(@Param('ticketId') ticketId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketCommentsService.findCommentsByTicketId(ticketId, user);
  }

  @Patch('ticket-comments/:id')
  updateComment(@Param('id') id: string, @Body() dto: UpdateTicketCommentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketCommentsService.updateComment(id, dto, user);
  }

  @Delete('ticket-comments/:id')
  softDeleteComment(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketCommentsService.softDeleteComment(id, user);
  }
}
