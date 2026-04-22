import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AccionHistorialSolicitud,
  EstadoSolicitud,
  Prisma,
  RolUsuario,
} from '@prisma/client';
import { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';
import { handlePrismaError } from '../comun/prisma-error.util';
import { construirFiltroVisibilidadSolicitudes } from '../comun/visibilidad-solicitudes.util';
import { PrismaService } from '../prisma/prisma.service';
import { AgregarObservacionSolicitudDto } from './dto/agregar-observacion-solicitud.dto';
import { AsignarSolicitudDto } from './dto/asignar-solicitud.dto';
import { CambiarEstadoSolicitudDto } from './dto/cambiar-estado-solicitud.dto';
import { CerrarSolicitudDto } from './dto/cerrar-solicitud.dto';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { DerivarSolicitudDto } from './dto/derivar-solicitud.dto';
import { FiltroSolicitudesDto } from './dto/filtro-solicitudes.dto';
import { FinalizarSolicitudDto } from './dto/finalizar-solicitud.dto';
import {
  ACTIVE_REQUEST_WHERE,
  combinarFiltrosSolicitud,
  construirFiltroConsultaSolicitudes,
} from './solicitudes-filtros';
import {
  obtenerAccionHistorialCambioEstado,
  validarCambioEstadoPermitido,
  validarSolicitudCerrable,
  validarSolicitudEditable,
  validarSolicitudFinalizable,
  validarTrabajadorPuedeOperarSolicitud,
  validarTrabajadorPuedeVerSolicitud,
} from './solicitudes-flujo';
import { presentarSolicitud } from './solicitudes-presentacion';

const SOLICITUD_INCLUDE = {
  creadoPor: {
    include: {
      area: true,
    },
  },
  asignadoA: {
    include: {
      area: true,
    },
  },
  areaActual: true,
  tipoSolicitud: true,
} satisfies Prisma.SolicitudInclude;

type DatosHistorialSolicitud = Prisma.HistorialSolicitudUncheckedCreateInput;

@Injectable()
export class SolicitudesService {
  constructor(private readonly prisma: PrismaService) {}

  async crear(createSolicitudDto: CreateSolicitudDto, usuario: UsuarioToken) {
    await this.asegurarUsuarioActivoExiste(usuario.id);
    await this.asegurarAreaActivaExiste(createSolicitudDto.areaActualId);
    await this.asegurarTipoSolicitudActivoExiste(
      createSolicitudDto.tipoSolicitudId,
    );

    if (createSolicitudDto.asignadoAId) {
      await this.validarDestinoAsignacion(
        createSolicitudDto.asignadoAId,
        createSolicitudDto.areaActualId,
      );
    }

    const fechaVencimiento = this.parsearFechaVencimiento(
      createSolicitudDto.fechaVencimiento,
    );

    const data: Prisma.SolicitudCreateInput = {
      titulo: createSolicitudDto.titulo,
      descripcion: createSolicitudDto.descripcion,
      prioridad: createSolicitudDto.prioridad,
      fechaVencimiento,
      creadoPor: {
        connect: { id: usuario.id },
      },
      areaActual: {
        connect: { id: createSolicitudDto.areaActualId },
      },
      tipoSolicitud: {
        connect: { id: createSolicitudDto.tipoSolicitudId },
      },
      ...(createSolicitudDto.asignadoAId
        ? {
            asignadoA: {
              connect: { id: createSolicitudDto.asignadoAId },
            },
          }
        : {}),
    };

    try {
      const solicitudCreada = await this.prisma.$transaction(async (tx) => {
        const solicitud = await tx.solicitud.create({ data });

        await this.crearEntradaHistorial(tx, {
          solicitudId: solicitud.id,
          usuarioId: usuario.id,
          accion: AccionHistorialSolicitud.CREADA,
          estadoDestino: solicitud.estado,
          areaDestinoId: solicitud.areaActualId,
          asignadoDestinoId: solicitud.asignadoAId,
          comentario: createSolicitudDto.comentario,
        });

        return solicitud;
      });

      return this.verDetalle(solicitudCreada.id, usuario);
    } catch (error) {
      handlePrismaError(error, 'solicitud');
    }
  }

  async listar(usuario: UsuarioToken, filtros: FiltroSolicitudesDto) {
    await this.asegurarUsuarioActivoExiste(usuario.id);

    const where = combinarFiltrosSolicitud(
      ACTIVE_REQUEST_WHERE,
      construirFiltroVisibilidadSolicitudes(usuario),
      construirFiltroConsultaSolicitudes(filtros),
    );

    const solicitudes = await this.prisma.solicitud.findMany({
      where,
      include: SOLICITUD_INCLUDE,
      orderBy: [{ creadoEn: 'desc' }],
      ...(typeof filtros.offset === 'number' ? { skip: filtros.offset } : {}),
      ...(typeof filtros.limite === 'number' ? { take: filtros.limite } : {}),
    });

    return solicitudes.map((solicitud) => presentarSolicitud(solicitud));
  }

  async verDetalle(id: number, usuario: UsuarioToken) {
    await this.asegurarUsuarioActivoExiste(usuario.id);

    const solicitud = await this.prisma.solicitud.findFirst({
      where: {
        id,
        ...ACTIVE_REQUEST_WHERE,
        ...construirFiltroVisibilidadSolicitudes(usuario),
      },
      include: {
        ...SOLICITUD_INCLUDE,
        historialEntradas: {
          include: {
            usuario: {
              omit: {
                contrasena: true,
              },
            },
            areaOrigen: true,
            areaDestino: true,
          },
          orderBy: {
            creadoEn: 'asc',
          },
        },
      },
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    const historialEnriquecido = await this.enriquecerHistorialAsignaciones(
      solicitud.historialEntradas,
    );

    return presentarSolicitud({
      ...solicitud,
      historialEntradas: historialEnriquecido,
    });
  }

  async asignarSolicitud(
    id: number,
    asignarSolicitudDto: AsignarSolicitudDto,
    usuario: UsuarioToken,
  ) {
    const solicitud = await this.asegurarSolicitudActivaExiste(id);
    await this.asegurarUsuarioActivoExiste(usuario.id);
    const asignadoA = await this.validarDestinoAsignacion(
      asignarSolicitudDto.asignadoAId,
      solicitud.areaActualId,
    );

    validarSolicitudEditable(solicitud);

    if (solicitud.asignadoAId === asignarSolicitudDto.asignadoAId) {
      throw new BadRequestException(
        'La solicitud ya se encuentra asignada a este usuario',
      );
    }

    await this.actualizarSolicitudConHistorial({
      solicitudId: id,
      datosSolicitud: {
        asignadoAId: asignadoA.id,
      },
      historial: {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.ASIGNADA,
        asignadoOrigenId: solicitud.asignadoAId,
        asignadoDestinoId: asignadoA.id,
        comentario: asignarSolicitudDto.comentario,
      },
    });

    return this.verDetalle(id, usuario);
  }

  async derivarSolicitudAArea(
    id: number,
    derivarSolicitudDto: DerivarSolicitudDto,
    usuario: UsuarioToken,
  ) {
    const solicitud = await this.asegurarSolicitudActivaExiste(id);
    await this.asegurarUsuarioActivoExiste(usuario.id);
    await this.asegurarAreaActivaExiste(derivarSolicitudDto.areaDestinoId);
    const asignadoA = await this.validarDestinoAsignacion(
      derivarSolicitudDto.asignadoAId,
      derivarSolicitudDto.areaDestinoId,
    );

    validarSolicitudEditable(solicitud);

    if (solicitud.areaActualId === derivarSolicitudDto.areaDestinoId) {
      throw new BadRequestException(
        'La solicitud ya se encuentra en el area de destino',
      );
    }

    await this.actualizarSolicitudConHistorial({
      solicitudId: id,
      datosSolicitud: {
        areaActualId: derivarSolicitudDto.areaDestinoId,
        asignadoAId: asignadoA.id,
        estado: EstadoSolicitud.DERIVADA,
      },
      historial: {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.DERIVADA,
        estadoOrigen: solicitud.estado,
        estadoDestino: EstadoSolicitud.DERIVADA,
        areaOrigenId: solicitud.areaActualId,
        areaDestinoId: derivarSolicitudDto.areaDestinoId,
        asignadoOrigenId: solicitud.asignadoAId,
        asignadoDestinoId: asignadoA.id,
        comentario: derivarSolicitudDto.comentario,
      },
    });

    return this.verDetalle(id, usuario);
  }

  async cambiarEstadoSolicitud(
    id: number,
    cambiarEstadoSolicitudDto: CambiarEstadoSolicitudDto,
    usuario: UsuarioToken,
  ) {
    const solicitud = await this.asegurarSolicitudActivaExiste(id);
    await this.asegurarUsuarioActivoExiste(usuario.id);
    validarTrabajadorPuedeOperarSolicitud(solicitud, usuario);
    validarSolicitudEditable(solicitud);

    validarCambioEstadoPermitido(
      solicitud,
      cambiarEstadoSolicitudDto.estado,
      usuario,
    );

    await this.actualizarSolicitudConHistorial({
      solicitudId: id,
      datosSolicitud: {
        estado: cambiarEstadoSolicitudDto.estado,
      },
      historial: {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: obtenerAccionHistorialCambioEstado(
          cambiarEstadoSolicitudDto.estado,
        ),
        estadoOrigen: solicitud.estado,
        estadoDestino: cambiarEstadoSolicitudDto.estado,
        comentario: cambiarEstadoSolicitudDto.comentario,
      },
    });

    return this.verDetalle(id, usuario);
  }

  async agregarObservacion(
    id: number,
    agregarObservacionSolicitudDto: AgregarObservacionSolicitudDto,
    usuario: UsuarioToken,
  ) {
    const solicitud = await this.asegurarSolicitudActivaExiste(id);
    await this.asegurarUsuarioActivoExiste(usuario.id);
    validarTrabajadorPuedeVerSolicitud(solicitud, usuario);

    await this.registrarHistorialSolicitud({
      solicitudId: id,
      usuarioId: usuario.id,
      accion: AccionHistorialSolicitud.OBSERVACION,
      estadoOrigen: solicitud.estado,
      estadoDestino: solicitud.estado,
      areaDestinoId: solicitud.areaActualId,
      asignadoDestinoId: solicitud.asignadoAId,
      comentario: agregarObservacionSolicitudDto.comentario,
    });

    return this.verDetalle(id, usuario);
  }

  async finalizarSolicitud(
    id: number,
    finalizarSolicitudDto: FinalizarSolicitudDto,
    usuario: UsuarioToken,
  ) {
    const solicitud = await this.asegurarSolicitudActivaExiste(id);
    await this.asegurarUsuarioActivoExiste(usuario.id);
    validarTrabajadorPuedeOperarSolicitud(solicitud, usuario);
    validarSolicitudFinalizable(solicitud);

    await this.actualizarSolicitudConHistorial({
      solicitudId: id,
      datosSolicitud: {
        estado: EstadoSolicitud.FINALIZADA,
      },
      historial: {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.FINALIZADA,
        estadoOrigen: solicitud.estado,
        estadoDestino: EstadoSolicitud.FINALIZADA,
        comentario: finalizarSolicitudDto.comentario,
      },
    });

    return this.verDetalle(id, usuario);
  }

  async cerrarSolicitud(
    id: number,
    cerrarSolicitudDto: CerrarSolicitudDto,
    usuario: UsuarioToken,
  ) {
    const solicitud = await this.asegurarSolicitudActivaExiste(id);
    await this.asegurarUsuarioActivoExiste(usuario.id);
    validarSolicitudCerrable(solicitud);

    await this.actualizarSolicitudConHistorial({
      solicitudId: id,
      datosSolicitud: {
        estado: EstadoSolicitud.CERRADA,
        fechaCierre: new Date(),
      },
      historial: {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.CERRADA,
        estadoOrigen: solicitud.estado,
        estadoDestino: EstadoSolicitud.CERRADA,
        comentario: cerrarSolicitudDto.comentario,
      },
    });

    return this.verDetalle(id, usuario);
  }

  async eliminarSolicitudLogicamente(
    id: number,
    actorUsuarioId: number,
    comentario?: string,
  ) {
    const solicitud = await this.asegurarSolicitudActivaExiste(id);
    await this.asegurarUsuarioActivoExiste(actorUsuarioId);

    await this.actualizarSolicitudConHistorial({
      solicitudId: id,
      datosSolicitud: {
        eliminadoEn: new Date(),
      },
      historial: {
        solicitudId: id,
        usuarioId: actorUsuarioId,
        accion: AccionHistorialSolicitud.ELIMINADA,
        estadoOrigen: solicitud.estado,
        estadoDestino: solicitud.estado,
        areaDestinoId: solicitud.areaActualId,
        asignadoDestinoId: solicitud.asignadoAId,
        comentario,
      },
    });

    return {
      message: `Solicitud ${id} eliminada logicamente`,
    };
  }

  private async asegurarSolicitudActivaExiste(id: number) {
    const solicitud = await this.prisma.solicitud.findFirst({
      where: {
        id,
        ...ACTIVE_REQUEST_WHERE,
      },
      include: SOLICITUD_INCLUDE,
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    return solicitud;
  }

  private async asegurarUsuarioActivoExiste(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario || !usuario.activo) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return usuario;
  }

  private async asegurarAreaActivaExiste(id: number) {
    const area = await this.prisma.area.findUnique({
      where: { id },
    });

    if (!area || !area.activo) {
      throw new NotFoundException(`Area con id ${id} no encontrada`);
    }

    return area;
  }

  private async asegurarTipoSolicitudActivoExiste(id: number) {
    const tipoSolicitud = await this.prisma.tipoSolicitud.findUnique({
      where: { id },
    });

    if (!tipoSolicitud || !tipoSolicitud.activo) {
      throw new NotFoundException(
        `Tipo de solicitud con id ${id} no encontrado`,
      );
    }

    return tipoSolicitud;
  }

  private async validarDestinoAsignacion(
    asignadoAId: number,
    areaActualId: number,
  ) {
    const asignadoA = await this.asegurarUsuarioActivoExiste(asignadoAId);

    if (asignadoA.rol !== RolUsuario.TRABAJADOR) {
      throw new BadRequestException(
        'Solo se puede asignar la solicitud a un usuario con rol TRABAJADOR',
      );
    }

    if (asignadoA.areaId !== areaActualId) {
      throw new BadRequestException(
        'El trabajador asignado debe pertenecer al area actual de la solicitud',
      );
    }

    return asignadoA;
  }

  private parsearFechaVencimiento(fecha: string) {
    const fechaVencimiento = new Date(fecha);

    if (Number.isNaN(fechaVencimiento.getTime())) {
      throw new BadRequestException('La fecha de vencimiento no es valida');
    }

    return fechaVencimiento;
  }

  private async enriquecerHistorialAsignaciones<
    T extends Array<{
      asignadoOrigenId?: number | null;
      asignadoDestinoId?: number | null;
    }>,
  >(historial: T) {
    const usuariosIds = Array.from(
      new Set(
        historial.flatMap((entrada) =>
          [entrada.asignadoOrigenId, entrada.asignadoDestinoId].filter(
            (id): id is number => typeof id === 'number',
          ),
        ),
      ),
    );

    if (usuariosIds.length === 0) {
      return historial;
    }

    const usuarios = await this.prisma.usuario.findMany({
      where: {
        id: {
          in: usuariosIds,
        },
      },
      include: {
        area: true,
      },
      omit: {
        contrasena: true,
      },
    });

    const usuariosPorId = new Map(usuarios.map((item) => [item.id, item]));

    return historial.map((entrada) => ({
      ...entrada,
      asignadoOrigen: entrada.asignadoOrigenId
        ? (usuariosPorId.get(entrada.asignadoOrigenId) ?? null)
        : null,
      asignadoDestino: entrada.asignadoDestinoId
        ? (usuariosPorId.get(entrada.asignadoDestinoId) ?? null)
        : null,
    }));
  }

  private crearEntradaHistorial(
    tx: Prisma.TransactionClient,
    data: DatosHistorialSolicitud,
  ) {
    return tx.historialSolicitud.create({ data });
  }

  private async registrarHistorialSolicitud(data: DatosHistorialSolicitud) {
    await this.prisma.$transaction(async (tx) => {
      await this.crearEntradaHistorial(tx, data);
    });
  }

  private async actualizarSolicitudConHistorial({
    solicitudId,
    datosSolicitud,
    historial,
  }: {
    solicitudId: number;
    datosSolicitud?: Prisma.SolicitudUncheckedUpdateInput;
    historial: DatosHistorialSolicitud;
  }) {
    await this.prisma.$transaction(async (tx) => {
      if (datosSolicitud) {
        await tx.solicitud.update({
          where: { id: solicitudId },
          data: datosSolicitud,
        });
      }

      await this.crearEntradaHistorial(tx, historial);
    });
  }
}
