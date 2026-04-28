import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateTicketCommentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  content?: string;
}
