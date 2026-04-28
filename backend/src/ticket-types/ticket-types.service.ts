import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

@Injectable()
export class TicketTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async createTicketType(dto: CreateTicketTypeDto) {
    try {
      return await this.prisma.ticketType.create({ data: dto });
    } catch (error) {
      this.handleTicketTypeError(error);
    }
  }

  findAllTicketTypes() {
    return this.prisma.ticketType.findMany({ orderBy: { name: 'asc' } });
  }

  async findTicketTypeById(id: string) {
    const ticketType = await this.prisma.ticketType.findUnique({ where: { id } });
    if (!ticketType) throw new NotFoundException('Ticket type not found');
    return ticketType;
  }

  async updateTicketType(id: string, dto: UpdateTicketTypeDto) {
    await this.findTicketTypeById(id);
    try {
      return await this.prisma.ticketType.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleTicketTypeError(error);
    }
  }

  enableTicketType(id: string) {
    return this.updateTicketType(id, { active: true });
  }

  disableTicketType(id: string) {
    return this.updateTicketType(id, { active: false });
  }

  private handleTicketTypeError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Ticket type name already exists');
    }
    throw error;
  }
}
