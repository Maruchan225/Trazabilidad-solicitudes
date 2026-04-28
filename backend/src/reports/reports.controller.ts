import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReportFiltersDto } from './dto/report-filters.dto';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.MANAGER, UserRole.SUBSTITUTE)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overdue-tickets')
  getOverdueTickets(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getOverdueTickets(filters);
  }

  @Get('near-due-tickets')
  getNearDueTickets(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getNearDueTickets(filters);
  }

  @Get('average-response-time')
  getAverageResponseTime(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getAverageResponseTime(filters);
  }

  @Get('workload-by-worker')
  getWorkloadByWorker(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getWorkloadByWorker(filters);
  }

  @Get('tickets-by-status')
  getTicketsByStatus(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getTicketsByStatus(filters);
  }

  @Get('tickets-by-type')
  getTicketsByType(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getTicketsByType(filters);
  }

  @Get('tickets-by-priority')
  getTicketsByPriority(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getTicketsByPriority(filters);
  }

  @Get('finished-tickets')
  getFinishedTickets(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getFinishedTickets(filters);
  }

  @Get('closed-tickets')
  getClosedTickets(@Query() filters: ReportFiltersDto) {
    return this.reportsService.getClosedTickets(filters);
  }
}
