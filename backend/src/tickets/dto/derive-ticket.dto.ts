import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeriveTicketDto {
  @IsString()
  @IsNotEmpty()
  toUserId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
