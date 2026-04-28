import { InputChannel, Priority } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTicketDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(50)
  code?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @IsEnum(Priority)
  priority: Priority;

  @IsEnum(InputChannel)
  inputChannel: InputChannel;

  @IsString()
  @IsNotEmpty()
  ticketTypeId: string;

  @IsString()
  @IsNotEmpty()
  assignedToId: string;
}
