import {
  BadRequestException,
  ForbiddenException,
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
import { PrismaService } from '../prisma/prisma.service';
import { AgregarObservacionSolicitudDto } from './dto/agregar-observacion-solicitud.dto';
import { AsignarSolicitudDto } from './dto/asignar-solicitud.dto';
import { CambiarEstadoSolicitudDto } from './dto/cambiar-estado-solicitud.dto';
import { CerrarSolicitudDto } from './dto/cerrar-solicitud.dto';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { DerivarSolicitudDto } from './dto/derivar-solicitud.dto';
import { FiltroSolicitudesDto } from './dto/filtro-solicitudes.dto';
import { FinalizarSolicitudDto } from './dto/finalizar-solicitud.dto';

const ACTIVE_REQUEST_WHERE = {
  eliminadoEn: null,
} satisfies Prisma.SolicitudWhereInput;

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

type SolicitudBase = Prisma.SolicitudGetPayload<{
  include: typeof SOLICITUD_INCLUDE;
}>;

type SolicitudPresentable = {
  estado: EstadoSolicitud;
  fechaVencimiento: Date;
  fechaCierre: Date | null;
};

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

    const fechaVencimiento = new Date(createSolicitudDto.fechaVencimiento);

    if (Number.isNaN(fechaVencimiento.getTime())) {
      throw new BadRequestException('La fecha de vencimiento no es valida');
    }

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

    const where = this.combinarFiltrosSolicitud(
      ACTIVE_REQUEST_WHERE,
      this.construirFiltroVisibilidad(usuario),
      this.construirFiltroConsulta(filtros),
    );

    const solicitudes = await this.prisma.solicitud.findMany({
      where,
      include: SOLICITUD_INCLUDE,
      orderBy: [{ creadoEn: 'desc' }],
    });

    return solicitudes.map((solicitud) => this.presentarSolicitud(solicitud));
  }

  async verDetalle(id: number, usuario: UsuarioToken) {
    await this.asegurarUsuarioActivoExiste(usuario.id);

    const solicitud = await this.prisma.solicitud.findFirst({
      where: {
        id,
        ...ACTIVE_REQUEST_WHERE,
        ...this.construirFiltroVisibilidad(usuario),
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

    return this.presentarSolicitud({
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

    this.validarSolicitudEditable(solicitud);

    if (solicitud.asignadoAId === asignarSolicitudDto.asignadoAId) {
      throw new BadRequestException(
        'La solicitud ya se encuentra asignada a este usuario',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.solicitud.update({
        where: { id },
        data: {
          asignadoAId: asignadoA.id,
        },
      });

      await this.crearEntradaHistorial(tx, {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.ASIGNADA,
        asignadoOrigenId: solicitud.asignadoAId,
        asignadoDestinoId: asignadoA.id,
        comentario: asignarSolicitudDto.comentario,
      });
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

    this.validarSolicitudEditable(solicitud);

    if (solicitud.areaActualId === derivarSolicitudDto.areaDestinoId) {
      throw new BadRequestException(
        'La solicitud ya se encuentra en el area de destino',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.solicitud.update({
        where: { id },
        data: {
          areaActualId: derivarSolicitudDto.areaDestinoId,
          asignadoAId: asignadoA.id,
          estado: EstadoSolicitud.DERIVADA,
        },
      });

      await this.crearEntradaHistorial(tx, {
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
      });
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
    this.validarTrabajadorPuedeOperarSolicitud(solicitud, usuario);
    this.validarSolicitudEditable(solicitud);

    if (
      cambiarEstadoSolicitudDto.estado === EstadoSolicitud.CERRADA ||
      cambiarEstadoSolicitudDto.estado === EstadoSolicitud.FINALIZADA
    ) {
      throw new BadRequestException(
        'Use los metodos finalizarSolicitud o cerrarSolicitud para estos cambios de estado',
      );
    }

    if (cambiarEstadoSolicitudDto.estado === EstadoSolicitud.VENCIDA) {
      throw new BadRequestException(
        'El estado VENCIDA se determina automaticamente segun la fecha de vencimiento',
      );
    }

    if (cambiarEstadoSolicitudDto.estado === EstadoSolicitud.DERIVADA) {
      throw new BadRequestException(
        'Use el metodo derivarSolicitudAArea para derivar solicitudes',
      );
    }

    if (solicitud.estado === cambiarEstadoSolicitudDto.estado) {
      throw new BadRequestException('La solicitud ya tiene este estado');
    }

    this.validarAsignacionRequeridaParaEstado(
      cambiarEstadoSolicitudDto.estado,
      solicitud.asignadoAId,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.solicitud.update({
        where: { id },
        data: {
          estado: cambiarEstadoSolicitudDto.estado,
        },
      });

      await this.crearEntradaHistorial(tx, {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.ESTADO_CAMBIADO,
        estadoOrigen: solicitud.estado,
        estadoDestino: cambiarEstadoSolicitudDto.estado,
        comentario: cambiarEstadoSolicitudDto.comentario,
      });
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
    this.validarTrabajadorPuedeVerSolicitud(solicitud, usuario);

    await this.prisma.$transaction(async (tx) => {
      await this.crearEntradaHistorial(tx, {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.OBSERVACION,
        estadoOrigen: solicitud.estado,
        estadoDestino: solicitud.estado,
        areaDestinoId: solicitud.areaActualId,
        asignadoDestinoId: solicitud.asignadoAId,
        comentario: agregarObservacionSolicitudDto.comentario,
      });
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
    this.validarTrabajadorPuedeOperarSolicitud(solicitud, usuario);
    this.validarSolicitudEditable(solicitud);
    this.validarAsignacionRequeridaParaEstado(
      EstadoSolicitud.FINALIZADA,
      solicitud.asignadoAId,
    );

    if (solicitud.estado === EstadoSolicitud.FINALIZADA) {
      throw new BadRequestException('La solicitud ya se encuentra finalizada');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.solicitud.update({
        where: { id },
        data: {
          estado: EstadoSolicitud.FINALIZADA,
        },
      });

      await this.crearEntradaHistorial(tx, {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.FINALIZADA,
        estadoOrigen: solicitud.estado,
        estadoDestino: EstadoSolicitud.FINALIZADA,
        comentario: finalizarSolicitudDto.comentario,
      });
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

    if (solicitud.estado === EstadoSolicitud.CERRADA) {
      throw new BadRequestException('La solicitud ya se encuentra cerrada');
    }

    if (solicitud.estado !== EstadoSolicitud.FINALIZADA) {
      throw new BadRequestException(
        'Solo se puede cerrar una solicitud que este en estado FINALIZADA',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.solicitud.update({
        where: { id },
        data: {
          estado: EstadoSolicitud.CERRADA,
          fechaCierre: new Date(),
        },
      });

      await this.crearEntradaHistorial(tx, {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.CERRADA,
        estadoOrigen: solicitud.estado,
        estadoDestino: EstadoSolicitud.CERRADA,
        comentario: cerrarSolicitudDto.comentario,
      });
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

    await this.prisma.$transaction(async (tx) => {
      await tx.solicitud.update({
        where: { id },
        data: {
          eliminadoEn: new Date(),
        },
      });

      await this.crearEntradaHistorial(tx, {
        solicitudId: id,
        usuarioId: actorUsuarioId,
        accion: AccionHistorialSolicitud.ELIMINADA,
        estadoOrigen: solicitud.estado,
        estadoDestino: solicitud.estado,
        areaDestinoId: solicitud.areaActualId,
        asignadoDestinoId: solicitud.asignadoAId,
        comentario,
      });
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

  private construirFiltroVisibilidad(
    usuario: UsuarioToken,
  ): Prisma.SolicitudWhereInput {
    if (usuario.rol === RolUsuario.TRABAJADOR) {
      return {
        OR: [{ asignadoAId: usuario.id }, { areaActualId: usuario.areaId }],
      };
    }

    return {};
  }

  private construirFiltroConsulta(
    filtros: FiltroSolicitudesDto,
  ): Prisma.SolicitudWhereInput {
    const busqueda = filtros.busqueda?.trim();
    const filtraVencidas = filtros.estado === EstadoSolicitud.VENCIDA;

    return {
      ...(filtros.estado && !filtraVencidas ? { estado: filtros.estado } : {}),
      ...(filtros.prioridad ? { prioridad: filtros.prioridad } : {}),
      ...(filtros.areaId ? { areaActualId: filtros.areaId } : {}),
      ...(filtros.tipoSolicitudId
        ? { tipoSolicitudId: filtros.tipoSolicitudId }
        : {}),
      ...(filtraVencidas
        ? {
            fechaCierre: null,
            fechaVencimiento: {
              lt: new Date(),
            },
          }
        : {}),
      ...(busqueda
        ? {
            OR: [
              { titulo: { contains: busqueda, mode: 'insensitive' } },
              { descripcion: { contains: busqueda, mode: 'insensitive' } },
              {
                areaActual: {
                  nombre: { contains: busqueda, mode: 'insensitive' },
                },
              },
              {
                tipoSolicitud: {
                  nombre: { contains: busqueda, mode: 'insensitive' },
                },
              },
              {
                asignadoA: {
                  OR: [
                    { nombres: { contains: busqueda, mode: 'insensitive' } },
                    { apellidos: { contains: busqueda, mode: 'insensitive' } },
                  ],
                },
              },
              ...(Number.isInteger(Number(busqueda))
                ? [{ id: Number(busqueda) }]
                : []),
            ],
          }
        : {}),
    };
  }

  private combinarFiltrosSolicitud(
    ...filtros: Prisma.SolicitudWhereInput[]
  ): Prisma.SolicitudWhereInput {
    const filtrosActivos = filtros.filter((filtro) => Object.keys(filtro).length);

    if (filtrosActivos.length === 0) {
      return {};
    }

    if (filtrosActivos.length === 1) {
      return filtrosActivos[0];
    }

    return {
      AND: filtrosActivos,
    };
  }

  private validarTrabajadorPuedeVerSolicitud(
    solicitud: Pick<SolicitudBase, 'asignadoAId' | 'areaActualId'>,
    usuario: UsuarioToken,
  ) {
    if (
      usuario.rol === RolUsuario.TRABAJADOR &&
      solicitud.asignadoAId !== usuario.id &&
      solicitud.areaActualId !== usuario.areaId
    ) {
      throw new ForbiddenException(
        'No tiene permisos para acceder a esta solicitud',
      );
    }
  }

  private validarTrabajadorPuedeOperarSolicitud(
    solicitud: Pick<SolicitudBase, 'asignadoAId'>,
    usuario: UsuarioToken,
  ) {
    if (
      usuario.rol === RolUsuario.TRABAJADOR &&
      solicitud.asignadoAId !== usuario.id
    ) {
      throw new ForbiddenException(
        'Solo el trabajador asignado puede operar esta solicitud',
      );
    }
  }

  private validarSolicitudEditable(solicitud: Pick<SolicitudBase, 'estado'>) {
    if (solicitud.estado === EstadoSolicitud.CERRADA) {
      throw new BadRequestException(
        'La solicitud esta cerrada y ya no admite modificaciones',
      );
    }
  }

  private validarAsignacionRequeridaParaEstado(
    estado: EstadoSolicitud,
    asignadoAId: number | null,
  ) {
    const statusesRequiringAssignee = new Set<EstadoSolicitud>([
      EstadoSolicitud.EN_PROCESO,
      EstadoSolicitud.PENDIENTE_INFORMACION,
      EstadoSolicitud.FINALIZADA,
    ]);

    if (statusesRequiringAssignee.has(estado) && !asignadoAId) {
      throw new BadRequestException(
        'La solicitud debe estar asignada a un trabajador para usar este estado',
      );
    }
  }

  private estaSolicitudVencida(solicitud: SolicitudPresentable) {
    return (
      !solicitud.fechaCierre &&
      solicitud.fechaVencimiento.getTime() < Date.now()
    );
  }

  private presentarSolicitud<T extends SolicitudPresentable>(solicitud: T) {
    const estaVencida = this.estaSolicitudVencida(solicitud);

    return {
      ...solicitud,
      estadoPersistido: solicitud.estado,
      estadoActual: estaVencida ? EstadoSolicitud.VENCIDA : solicitud.estado,
      estaVencida,
    };
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
    data: Prisma.HistorialSolicitudUncheckedCreateInput,
  ) {
    return tx.historialSolicitud.create({ data });
  }
}
