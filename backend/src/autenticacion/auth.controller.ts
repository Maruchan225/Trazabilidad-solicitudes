import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Publico } from './decoradores/publico.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Publico()
  iniciarSesion(@Body() loginDto: LoginDto) {
    return this.authService.iniciarSesion(loginDto);
  }
}
