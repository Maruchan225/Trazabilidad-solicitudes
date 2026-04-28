import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from './current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginThrottleGuard } from './guards/login-throttle.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LoginThrottleGuard)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getCurrentUser(user);
  }
}
