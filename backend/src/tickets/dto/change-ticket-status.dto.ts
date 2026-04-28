import { TicketStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ChangeTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(1000)
  observation?: string;
}
