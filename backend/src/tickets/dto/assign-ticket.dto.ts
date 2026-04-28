import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignTicketDto {
  @IsString()
  @IsNotEmpty()
  assignedToId: string;

  @IsOptional()
  @IsString()
  observation?: string;
}
