import { BadRequestException, Injectable } from '@nestjs/common';
import { EstadoSolicitud, Prisma } from '@prisma/client';
import { USUARIO_PUBLICO_CON_AREA_ARGS } from '../comun/usuario-seguro.util';
import { PrismaService } from '../prisma/prisma.service';
import { FiltroReportesDto } from './dto/filtro-reportes.dto';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerResumenGeneral(filtros: FiltroReportesDto) {
    const where = this.construirFiltroReporte(filtros);
    const [totalSolicitudes, solicitudesPorEstado, proximasAVencer] =
      await Promise.all([
        this.prisma.solicitud.count({ where }),
        this.prisma.solicitud.groupBy({
          by: ['estado'],
          where,
          _count: {
            _all: true,
          },
        }),
        this.prisma.solicitud.count({ where: this.construirFiltroProximasAVencer(where) }),
      ]);

    const mapaEstados = new Map(
      solicitudesPorEstado.map((item) => [item.estado, item._count._all]),
    );

    const solicitudesVencidas = await this.contarSolicitudesVencidas(where);

    return {
      totalSolicitudes,
      solicitudesIngresadas: mapaEstados.get(EstadoSolicitud.INGRESADA) ?? 0,
      solicitudesDerivadas: mapaEstados.get(EstadoSolicitud.DERIVADA) ?? 0,
      solicitudesEnProceso: mapaEstados.get(EstadoSolicitud.EN_PROCESO) ?? 0,
      solicitudesFinalizadas: mapaEstados.get(EstadoSolicitud.FINALIZADA) ?? 0,
      solicitudesCerradas: mapaEstados.get(EstadoSolicitud.CERRADA) ?? 0,
      solicitudesVencidas,
      solicitudesProximasAVencer: proximasAVencer,
    };
  }

  async obtenerSolicitudesPorEstado(filtros: FiltroReportesDto) {
    const where = this.construirFiltroReporte(filtros);
    const [agrupadas, solicitudesVencidas] = await Promise.all([
      this.prisma.solicitud.groupBy({
        by: ['estado'],
        where,
        _count: {
          _all: true,
        },
      }),
      this.contarSolicitudesVencidas(where),
    ]);

    const resultado = agrupadas.map((item) => ({
      estado: item.estado,
      cantidad: item._count._all,
    }));

    return {
      items: resultado,
      totalVencidasCalculadas: solicitudesVencidas,
    };
  }

  async obtenerSolicitudesPorArea(filtros: FiltroReportesDto) {
    const where = this.construirFiltroReporte(filtros);

    const items = await this.prisma.area.findMany({
      where: filtros.areaId ? { id: filtros.areaId } : undefined,
      orderBy: {
        nombre: 'asc',
      },
      select: {
        id: true,
        nombre: true,
        solicitudesActuales: {
          where,
          select: {
            id: true,
          },
        },
      },
    });

    return items.map((area) => ({
      areaId: area.id,
      area: area.nombre,
      cantidad: area.solicitudesActuales.length,
    }));
  }

  async obtenerCargaPorTrabajador(filtros: FiltroReportesDto) {
    const where = this.construirFiltroReporte(filtros);

    const trabajadores = await this.prisma.usuario.findMany({
      where: {
        rol: 'TRABAJADOR',
        ...(filtros.trabajadorId ? { id: filtros.trabajadorId } : {}),
        ...(filtros.areaId ? { areaId: filtros.areaId } : {}),
      },
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        area: {
          select: {
            id: true,
            nombre: true,
          },
        },
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

    return trabajadores.map((trabajador) => ({
      trabajadorId: trabajador.id,
      nombreCompleto: `${trabajador.nombres} ${trabajador.apellidos}`,
      areaId: trabajador.area.id,
      area: trabajador.area.nombre,
      totalAsignadas: trabajador.solicitudesAsignadas.length,
      enProceso: trabajador.solicitudesAsignadas.filter(
        (solicitud) => solicitud.estado === EstadoSolicitud.EN_PROCESO,
      ).length,
      pendientesInformacion: trabajador.solicitudesAsignadas.filter(
        (solicitud) =>
          solicitud.estado === EstadoSolicitud.PENDIENTE_INFORMACION,
      ).length,
      finalizadas: trabajador.solicitudesAsignadas.filter(
        (solicitud) => solicitud.estado === EstadoSolicitud.FINALIZADA,
      ).length,
      cerradas: trabajador.solicitudesAsignadas.filter(
        (solicitud) => solicitud.estado === EstadoSolicitud.CERRADA,
      ).length,
      vencidas: trabajador.solicitudesAsignadas.filter((solicitud) =>
        this.esSolicitudVencida(solicitud),
      ).length,
    }));
  }

  async obtenerTiempoPromedioRespuesta(filtros: FiltroReportesDto) {
    const where = this.construirFiltroReporte(filtros);
    const solicitudesCerradas = await this.prisma.solicitud.findMany({
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
        areaActual: {
          select: {
            id: true,
            nombre: true,
          },
        },
        tipoSolicitud: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    const tiemposEnHoras = solicitudesCerradas.map((solicitud) =>
      this.calcularHorasEntreFechas(
        solicitud.creadoEn,
        solicitud.fechaCierre as Date,
      ),
    );

    const promedioHoras =
      tiemposEnHoras.length > 0
        ? this.redondear(
            tiemposEnHoras.reduce((acc, valor) => acc + valor, 0) /
              tiemposEnHoras.length,
          )
        : 0;

    return {
      totalSolicitudesCerradas: solicitudesCerradas.length,
      tiempoPromedioHoras: promedioHoras,
      tiempoPromedioDias: this.redondear(promedioHoras / 24),
    };
  }

  async obtenerSolicitudesVencidas(filtros: FiltroReportesDto) {
    const where = this.construirFiltroReporte(filtros);

    const solicitudes = await this.prisma.solicitud.findMany({
      where: this.construirFiltroSolicitudesVencidas(where),
      include: {
        areaActual: true,
        asignadoA: USUARIO_PUBLICO_CON_AREA_ARGS,
        tipoSolicitud: true,
      },
      orderBy: {
        fechaVencimiento: 'asc',
      },
    });

    return solicitudes.map((solicitud) => ({
      id: solicitud.id,
      titulo: solicitud.titulo,
      estado: solicitud.estado,
      fechaVencimiento: solicitud.fechaVencimiento,
      diasAtraso: this.calcularDiasAtraso(solicitud.fechaVencimiento),
      areaId: solicitud.areaActual.id,
      area: solicitud.areaActual.nombre,
      tipoSolicitudId: solicitud.tipoSolicitud.id,
      tipoSolicitud: solicitud.tipoSolicitud.nombre,
      asignadoAId: solicitud.asignadoA?.id ?? null,
      asignadoA: solicitud.asignadoA
        ? `${solicitud.asignadoA.nombres} ${solicitud.asignadoA.apellidos}`
        : null,
    }));
  }

  async obtenerSolicitudesPorTipo(filtros: FiltroReportesDto) {
    const where = this.construirFiltroReporte(filtros);

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

    return items.map((tipoSolicitud) => ({
      tipoSolicitudId: tipoSolicitud.id,
      tipoSolicitud: tipoSolicitud.nombre,
      cantidad: tipoSolicitud.solicitudes.length,
    }));
  }

  private construirFiltroReporte(
    filtros: FiltroReportesDto,
  ): Prisma.SolicitudWhereInput {
    const { fechaDesde, fechaHasta } = this.obtenerRangoFechasValido(filtros);

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      throw new BadRequestException(
        'fechaDesde no puede ser mayor que fechaHasta',
      );
    }

    const filtroFecha =
      fechaDesde || fechaHasta
        ? {
            creadoEn: {
              ...(fechaDesde ? { gte: this.inicioDelDia(fechaDesde) } : {}),
              ...(fechaHasta ? { lte: this.finDelDia(fechaHasta) } : {}),
            },
          }
        : {};

    return {
      eliminadoEn: null,
      ...filtroFecha,
      ...(filtros.areaId ? { areaActualId: filtros.areaId } : {}),
      ...(filtros.trabajadorId ? { asignadoAId: filtros.trabajadorId } : {}),
      ...(filtros.tipoSolicitudId
        ? { tipoSolicitudId: filtros.tipoSolicitudId }
        : {}),
    };
  }

  private async contarSolicitudesVencidas(where: Prisma.SolicitudWhereInput) {
    return this.prisma.solicitud.count({
      where: this.construirFiltroSolicitudesVencidas(where),
    });
  }

  private obtenerRangoFechasValido(filtros: FiltroReportesDto) {
    const fechaDesde = this.parsearFechaOpcional(
      filtros.fechaDesde,
      'fechaDesde no es una fecha valida',
    );
    const fechaHasta = this.parsearFechaOpcional(
      filtros.fechaHasta,
      'fechaHasta no es una fecha valida',
    );

    return { fechaDesde, fechaHasta };
  }

  private parsearFechaOpcional(valor: string | undefined, mensajeError: string) {
    if (!valor) {
      return undefined;
    }

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException(mensajeError);
    }

    return fecha;
  }

  private construirFiltroSolicitudesVencidas(where: Prisma.SolicitudWhereInput) {
    return {
      ...where,
      fechaCierre: null,
      NOT: {
        estado: {
          in: [EstadoSolicitud.FINALIZADA, EstadoSolicitud.CERRADA],
        },
      },
      fechaVencimiento: {
        lt: new Date(),
      },
    };
  }

  private construirFiltroProximasAVencer(where: Prisma.SolicitudWhereInput) {
    return {
      ...where,
      fechaCierre: null,
      NOT: {
        estado: {
          in: [EstadoSolicitud.FINALIZADA, EstadoSolicitud.CERRADA],
        },
      },
      fechaVencimiento: {
        gte: new Date(),
        lte: this.sumarDias(new Date(), 3),
      },
    };
  }

  private esSolicitudVencida(solicitud: {
    fechaCierre: Date | null;
    fechaVencimiento: Date;
    estado: EstadoSolicitud;
  }) {
    const estaTerminada =
      solicitud.fechaCierre ||
      solicitud.estado === EstadoSolicitud.FINALIZADA ||
      solicitud.estado === EstadoSolicitud.CERRADA;
    return !estaTerminada && solicitud.fechaVencimiento < new Date();
  }

  private calcularHorasEntreFechas(inicio: Date, fin: Date) {
    return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60);
  }

  private calcularDiasAtraso(fechaVencimiento: Date) {
    const diferencia = Date.now() - fechaVencimiento.getTime();
    return Math.max(1, Math.ceil(diferencia / (1000 * 60 * 60 * 24)));
  }

  private sumarDias(fecha: Date, dias: number) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);
    return nuevaFecha;
  }

  private inicioDelDia(fecha: Date) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setHours(0, 0, 0, 0);
    return nuevaFecha;
  }

  private finDelDia(fecha: Date) {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setHours(23, 59, 59, 999);
    return nuevaFecha;
  }

  private redondear(valor: number) {
    return Number(valor.toFixed(2));
  }
}
