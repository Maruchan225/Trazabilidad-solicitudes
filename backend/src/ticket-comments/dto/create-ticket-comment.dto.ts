import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateTicketCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  content: string;
}
