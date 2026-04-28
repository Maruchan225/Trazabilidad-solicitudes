import { InputChannel, Priority } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
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
