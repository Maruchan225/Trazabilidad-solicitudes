import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';
import { TicketTypesService } from './ticket-types.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ticket-types')
export class TicketTypesController {
  constructor(private readonly ticketTypesService: TicketTypesService) {}

  @Get()
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
  findAllTicketTypes() {
    return this.ticketTypesService.findAllTicketTypes();
  }

  @Get(':id')
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
  findTicketTypeById(@Param('id') id: string) {
    return this.ticketTypesService.findTicketTypeById(id);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
  createTicketType(@Body() dto: CreateTicketTypeDto) {
    return this.ticketTypesService.createTicketType(dto);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
  updateTicketType(@Param('id') id: string, @Body() dto: UpdateTicketTypeDto) {
    return this.ticketTypesService.updateTicketType(id, dto);
  }

  @Patch(':id/enable')
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
  enableTicketType(@Param('id') id: string) {
    return this.ticketTypesService.enableTicketType(id);
  }

  @Patch(':id/disable')
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
  disableTicketType(@Param('id') id: string) {
    return this.ticketTypesService.disableTicketType(id);
  }
}
