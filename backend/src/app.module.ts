import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { validateEnvironment } from './config/environment';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReportsModule } from './reports/reports.module';
import { TicketAttachmentsModule } from './ticket-attachments/ticket-attachments.module';
import { TicketCommentsModule } from './ticket-comments/ticket-comments.module';
import { TicketTypesModule } from './ticket-types/ticket-types.module';
import { TicketsModule } from './tickets/tickets.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TicketsModule,
    TicketTypesModule,
    TicketCommentsModule,
    TicketAttachmentsModule,
    DashboardModule,
    HealthModule,
    ReportsModule
  ]
})
export class AppModule {}
