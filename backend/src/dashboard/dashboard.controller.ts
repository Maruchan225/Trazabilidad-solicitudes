import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DashboardService } from './dashboard.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getDashboard(user);
  }

  @Get('manager')
  @Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
  getManagerDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getManagerDashboard(user);
  }

  @Get('worker')
  @Roles(UserRole.WORKER)
  getWorkerDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getWorkerDashboard(user);
  }
}
