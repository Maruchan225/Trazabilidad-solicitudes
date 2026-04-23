import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Publico } from './decoradores/publico.decorator';
import { LoginDto } from './dto/login.dto';
import { LoginRateLimitGuard } from './guardias/login-rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Publico()
  @UseGuards(LoginRateLimitGuard)
  iniciarSesion(@Body() loginDto: LoginDto) {
    return this.authService.iniciarSesion(loginDto);
  }
}
