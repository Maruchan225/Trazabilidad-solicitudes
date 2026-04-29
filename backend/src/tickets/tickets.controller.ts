import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ChangeTicketStatusDto } from './dto/change-ticket-status.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { DeriveTicketDto } from './dto/derive-ticket.dto';
import { ReopenTicketDto } from './dto/reopen-ticket.dto';
import { TicketFiltersDto } from './dto/ticket-filters.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAllTickets(@Query() filters: TicketFiltersDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.findAllTickets(filters, user);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE, UserRole.SECRETARY)
  createTicket(@Body() dto: CreateTicketDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.createTicket(dto, user);
  }

  @Patch(':id')
  updateTicket(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.updateTicket(id, dto, user);
  }

  @Patch(':id/assign')
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE, UserRole.SECRETARY)
  assignTicket(@Param('id') id: string, @Body() dto: AssignTicketDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.assignTicket(id, dto, user);
  }

  @Patch(':id/derive')
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
  deriveTicket(@Param('id') id: string, @Body() dto: DeriveTicketDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.deriveTicket(id, dto, user);
  }

  @Patch(':id/status')
  changeTicketStatus(@Param('id') id: string, @Body() dto: ChangeTicketStatusDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.changeTicketStatus(id, dto, user);
  }

  @Patch(':id/finish')
  finishTicket(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.finishTicket(id, user);
  }

  @Patch(':id/close')
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
  closeTicket(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.closeTicket(id, user);
  }

  @Patch(':id/reopen')
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
  reopenTicket(@Param('id') id: string, @Body() dto: ReopenTicketDto, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.reopenTicket(id, dto, user);
  }

  @Get(':id/history')
  getTicketHistory(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.getTicketHistory(id, user);
  }

  @Get(':id')
  findTicketById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.ticketsService.findTicketById(id, user);
  }
}
