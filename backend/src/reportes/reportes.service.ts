import { BadRequestException, Injectable } from '@nestjs/common';
import { EstadoSolicitud, Prisma, PrioridadSolicitud } from '@prisma/client';
import type { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';
import { SAFE_USER_WITH_AREA_ARGS } from '../comun/usuario-seguro.util';
import { PrismaService } from '../prisma/prisma.service';
import { FiltroReportesDto } from './dto/filtro-reportes.dto';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerResumenGeneral(filtros: FiltroReportesDto) {
    const where = this.buildReportFilter(filtros);
    const [totalRequests, requestsByStatus, dueSoonCount] =
      await Promise.all([
        this.prisma.solicitud.count({ where }),
        this.prisma.solicitud.groupBy({
          by: ['estado'],
          where,
          _count: {
            _all: true,
          },
        }),
        this.prisma.solicitud.count({ where: this.buildDueSoonFilter(where) }),
      ]);

    const statusMap = new Map(
      requestsByStatus.map((item) => [item.estado, item._count._all]),
    );

    const overdueRequests = await this.countOverdueRequests(where);

    return {
      totalSolicitudes: totalRequests,
      solicitudesIngresadas: statusMap.get(EstadoSolicitud.INGRESADA) ?? 0,
      solicitudesEnProceso: statusMap.get(EstadoSolicitud.EN_PROCESO) ?? 0,
      solicitudesFinalizadas: statusMap.get(EstadoSolicitud.FINALIZADA) ?? 0,
      solicitudesCerradas: statusMap.get(EstadoSolicitud.CERRADA) ?? 0,
      solicitudesVencidas: overdueRequests,
      solicitudesProximasAVencer: dueSoonCount,
    };
  }

  async obtenerSolicitudesPorEstado(filtros: FiltroReportesDto) {
    const where = this.buildReportFilter(filtros);
    const [groupedItems, overdueRequests] = await Promise.all([
      this.prisma.solicitud.groupBy({
        by: ['estado'],
        where,
        _count: {
          _all: true,
        },
      }),
      this.countOverdueRequests(where),
    ]);

    const items = groupedItems.map((item) => ({
      estado: item.estado,
      cantidad: item._count._all,
    }));

    return {
      items,
      totalVencidasCalculadas: overdueRequests,
    };
  }

  async obtenerCargaPorTrabajador(filtros: FiltroReportesDto) {
    const where = this.buildReportFilter(filtros);

    const workers = await this.prisma.usuario.findMany({
      where: {
        rol: 'TRABAJADOR',
        ...(filtros.trabajadorId ? { id: filtros.trabajadorId } : {}),
      },
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        solicitudesAsignadas: {
          where,
          select: {
            id: true,
            estado: true,
            fechaCierre: true,
            fechaVencimiento: true,
          },
        },
      },
    });

    return workers.map((worker) => ({
      trabajadorId: worker.id,
      nombreCompleto: `${worker.nombres} ${worker.apellidos}`,
      totalAsignadas: worker.solicitudesAsignadas.length,
      enProceso: worker.solicitudesAsignadas.filter(
        (request) => request.estado === EstadoSolicitud.EN_PROCESO,
      ).length,
      pendientesInformacion: worker.solicitudesAsignadas.filter(
        (request) =>
          request.estado === EstadoSolicitud.PENDIENTE_INFORMACION,
      ).length,
      finalizadas: worker.solicitudesAsignadas.filter(
        (request) => request.estado === EstadoSolicitud.FINALIZADA,
      ).length,
      cerradas: worker.solicitudesAsignadas.filter(
        (request) => request.estado === EstadoSolicitud.CERRADA,
      ).length,
      vencidas: worker.solicitudesAsignadas.filter((request) =>
        this.isRequestOverdue(request),
      ).length,
    }));
  }

  async obtenerTiempoPromedioRespuesta(filtros: FiltroReportesDto) {
    const where = this.buildReportFilter(filtros);
    const closedRequests = await this.prisma.solicitud.findMany({
      where: {
        ...where,
        fechaCierre: {
          not: null,
        },
      },
      select: {
        id: true,
        creadoEn: true,
        fechaCierre: true,
        tipoSolicitud: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    const durationsInHours = closedRequests.map((request) =>
      this.calculateHoursBetweenDates(
        request.creadoEn,
        request.fechaCierre as Date,
      ),
    );

    const averageHours =
      durationsInHours.length > 0
        ? this.round(
            durationsInHours.reduce((acc, value) => acc + value, 0) /
              durationsInHours.length,
          )
        : 0;

    return {
      totalSolicitudesCerradas: closedRequests.length,
      tiempoPromedioHoras: averageHours,
      tiempoPromedioDias: this.round(averageHours / 24),
    };
  }

  async obtenerSolicitudesVencidas(filtros: FiltroReportesDto) {
    const where = this.buildReportFilter(filtros);

    const requests = await this.prisma.solicitud.findMany({
      where: this.buildOverdueRequestsFilter(where),
      include: {
        asignadoA: SAFE_USER_WITH_AREA_ARGS,
        tipoSolicitud: true,
      },
      orderBy: {
        fechaVencimiento: 'asc',
      },
    });

    return requests.map((request) => ({
      id: request.id,
      correlativo: request.correlativo,
      numeroSolicitud: request.numeroSolicitud,
      titulo: request.titulo,
      estado: request.estado,
      fechaVencimiento: request.fechaVencimiento,
      diasAtraso: this.calculateDelayDays(request.fechaVencimiento),
      tipoSolicitudId: request.tipoSolicitud.id,
      tipoSolicitud: request.tipoSolicitud.nombre,
      asignadoAId: request.asignadoA?.id ?? null,
      asignadoA: request.asignadoA
        ? `${request.asignadoA.nombres} ${request.asignadoA.apellidos}`
        : null,
    }));
  }

  async obtenerSolicitudesPorTipo(filtros: FiltroReportesDto) {
    const where = this.buildReportFilter(filtros);

    const items = await this.prisma.tipoSolicitud.findMany({
      where: filtros.tipoSolicitudId
        ? { id: filtros.tipoSolicitudId }
        : undefined,
      orderBy: {
        nombre: 'asc',
      },
      select: {
        id: true,
        nombre: true,
        solicitudes: {
          where,
          select: {
            id: true,
          },
        },
      },
    });

    return items.map((requestType) => ({
      tipoSolicitudId: requestType.id,
      tipoSolicitud: requestType.nombre,
      cantidad: requestType.solicitudes.length,
    }));
  }

  async obtenerSolicitudesPorPrioridad(filtros: FiltroReportesDto) {
    const where = this.buildReportFilter(filtros);

    const agrupadas = await this.prisma.solicitud.groupBy({
      by: ['prioridad'],
      where,
      _count: {
        _all: true,
      },
    });

    const priorities = [
      PrioridadSolicitud.BAJA,
      PrioridadSolicitud.MEDIA,
      PrioridadSolicitud.ALTA,
      PrioridadSolicitud.URGENTE,
    ];

    return priorities.map((priority) => ({
      prioridad: priority,
      cantidad:
        agrupadas.find((item) => item.prioridad === priority)?._count._all ?? 0,
    }));
  }

  async obtenerDashboardTrabajador(usuario: UsuarioToken) {
    const baseWhere: Prisma.SolicitudWhereInput = {
      eliminadoEn: null,
      asignadoAId: usuario.id,
    };

    const [
      solicitudesNuevas,
      solicitudesEnProceso,
      solicitudesCerradas,
      solicitudesPorVencer,
      solicitudesVencidas,
      solicitudesACargo,
    ] = await Promise.all([
      this.prisma.solicitud.count({
        where: {
          ...baseWhere,
          estado: {
            in: [EstadoSolicitud.INGRESADA, EstadoSolicitud.DERIVADA],
          },
        },
      }),
      this.prisma.solicitud.count({
        where: {
          ...baseWhere,
          estado: EstadoSolicitud.EN_PROCESO,
        },
      }),
      this.prisma.solicitud.count({
        where: {
          ...baseWhere,
          estado: EstadoSolicitud.CERRADA,
        },
      }),
      this.prisma.solicitud.count({
        where: this.buildDueSoonFilter(baseWhere),
      }),
      this.prisma.solicitud.count({
        where: this.buildOverdueRequestsFilter(baseWhere),
      }),
      this.prisma.solicitud.count({
        where: {
          ...baseWhere,
          fechaCierre: null,
        },
      }),
    ]);

    return {
      solicitudesNuevas,
      solicitudesEnProceso,
      solicitudesCerradas,
      solicitudesPorVencer,
      solicitudesVencidas,
      solicitudesACargo,
    };
  }

  private buildReportFilter(
    filtros: FiltroReportesDto,
  ): Prisma.SolicitudWhereInput {
    const { fechaDesde, fechaHasta } = this.getValidDateRange(filtros);

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'fechaDesde no puede ser mayor que fechaHasta',
      );
    }

    const dateFilter =
      fechaDesde || fechaHasta
        ? {
            creadoEn: {
              ...(fechaDesde ? { gte: this.startOfDay(fechaDesde) } : {}),
              ...(fechaHasta ? { lte: this.endOfDay(fechaHasta) } : {}),
            },
          }
        : {};

    return {
      eliminadoEn: null,
      ...dateFilter,
      ...(filtros.trabajadorId ? { asignadoAId: filtros.trabajadorId } : {}),
      ...(filtros.tipoSolicitudId
        ? { tipoSolicitudId: filtros.tipoSolicitudId }
        : {}),
    };
  }

  private async countOverdueRequests(where: Prisma.SolicitudWhereInput) {
    return this.prisma.solicitud.count({
      where: this.buildOverdueRequestsFilter(where),
    });
  }

  private getValidDateRange(filtros: FiltroReportesDto) {
    const fechaDesde = this.parseOptionalDate(
      filtros.fechaDesde,
      'fechaDesde no es una fecha valida',
    );
    const fechaHasta = this.parseOptionalDate(
      filtros.fechaHasta,
      'fechaHasta no es una fecha valida',
    );

    return { fechaDesde, fechaHasta };
  }

  private parseOptionalDate(value: string | undefined, errorMessage: string) {
    if (!value) {
      return undefined;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(errorMessage);
    }

    return parsedDate;
  }

  private buildOverdueRequestsFilter(where: Prisma.SolicitudWhereInput) {
    return {
      ...where,
      fechaCierre: null,
      fechaVencimiento: {
        lt: new Date(),
      },
    };
  }

  private buildDueSoonFilter(where: Prisma.SolicitudWhereInput) {
    return {
      ...where,
      fechaCierre: null,
      fechaVencimiento: {
        gte: new Date(),
        lte: this.addDays(new Date(), 3),
      },
    };
  }

  private isRequestOverdue(request: {
    fechaCierre: Date | null;
    fechaVencimiento: Date;
  }) {
    return !request.fechaCierre && request.fechaVencimiento < new Date();
  }

  private calculateHoursBetweenDates(start: Date, end: Date) {
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  }

  private calculateDelayDays(dueDate: Date) {
    const difference = Date.now() - dueDate.getTime();
    return Math.max(1, Math.ceil(difference / (1000 * 60 * 60 * 24)));
  }

  private addDays(date: Date, days: number) {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private startOfDay(date: Date) {
    const nextDate = new Date(date);
    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
  }

  private endOfDay(date: Date) {
    const nextDate = new Date(date);
    nextDate.setHours(23, 59, 59, 999);
    return nextDate;
  }

  private round(value: number) {
    return Number(value.toFixed(2));
  }
}
