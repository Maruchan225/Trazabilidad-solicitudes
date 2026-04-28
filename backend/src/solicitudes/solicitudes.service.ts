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
import {
  SAFE_USER_ARGS,
  SAFE_USER_WITH_AREA_ARGS,
} from '../comun/usuario-seguro.util';
import { buildRequestsVisibilityFilter } from '../comun/visibilidad-solicitudes.util';
import { PrismaService } from '../prisma/prisma.service';
import { AgregarObservacionSolicitudDto as AddCommentDto } from './dto/agregar-observacion-solicitud.dto';
import { AsignarSolicitudDto as AssignRequestDto } from './dto/asignar-solicitud.dto';
import { CambiarEstadoSolicitudDto as ChangeStatusDto } from './dto/cambiar-estado-solicitud.dto';
import { CerrarSolicitudDto as CloseRequestDto } from './dto/cerrar-solicitud.dto';
import { CreateSolicitudDto as CreateRequestDto } from './dto/create-solicitud.dto';
import { DerivarSolicitudDto as TransferRequestDto } from './dto/derivar-solicitud.dto';
import { FiltroSolicitudesDto } from './dto/filtro-solicitudes.dto';
import { FinalizarSolicitudDto as FinalizeRequestDto } from './dto/finalizar-solicitud.dto';
import {
  ACTIVE_REQUEST_WHERE,
  buildRequestsQueryFilter,
  combineRequestFilters,
} from './solicitudes-filtros';
import {
  getHistoryActionForStatusChange,
  validateRequestClosable,
  validateRequestEditable,
  validateRequestFinalizable,
  validateStatusChangeAllowed,
  validateWorkerCanOperateRequest,
  validateWorkerCanViewRequest,
} from './solicitudes-flujo';
import { presentRequest } from './solicitudes-presentacion';

const REQUEST_INCLUDE = {
  creadoPor: SAFE_USER_WITH_AREA_ARGS,
  asignadoA: SAFE_USER_WITH_AREA_ARGS,
  areaActual: true,
  tipoSolicitud: true,
} satisfies Prisma.SolicitudInclude;

type RequestHistoryData = Prisma.HistorialSolicitudUncheckedCreateInput;

@Injectable()
export class SolicitudesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createRequestDto: CreateRequestDto, usuario: UsuarioToken) {
    await this.ensureActiveUserExists(usuario.id);
    const requestType = await this.ensureActiveRequestTypeExists(
      createRequestDto.tipoSolicitudId,
    );
    if (typeof createRequestDto.asignadoAId !== 'number') {
      throw new BadRequestException(
        'Debe asignar un responsable al crear la solicitud',
      );
    }
    const externalReference = this.normalizeAndValidateExternalReference(
      createRequestDto.numeroSolicitud,
    );
    const assignedUser = await this.validateAssignmentTarget(
      createRequestDto.asignadoAId,
    );

    const areaActualId = this.resolveCurrentAreaId(
      assignedUser.areaId,
      usuario.areaId,
    );
    await this.ensureActiveAreaExists(areaActualId);

    const dueDate = this.calculateDueDateFromSla(
      requestType.diasSla,
    );

    try {
      const createdRequest = await this.createRequestWithAvailableSequenceNumber({
        data: {
          titulo: createRequestDto.titulo,
          descripcion: createRequestDto.descripcion,
          prioridad: createRequestDto.prioridad,
          canalIngreso: createRequestDto.canalIngreso,
          fechaVencimiento: dueDate,
          creadoPor: {
            connect: { id: usuario.id },
          },
          areaActual: {
            connect: { id: areaActualId },
          },
          tipoSolicitud: {
            connect: { id: createRequestDto.tipoSolicitudId },
          },
          ...(externalReference ? { numeroSolicitud: externalReference } : {}),
          asignadoA: {
            connect: { id: assignedUser.id },
          },
        },
        usuarioId: usuario.id,
        comentario: createRequestDto.comentario,
      });

      return this.getDetails(createdRequest.id, usuario);
    } catch (error) {
      handlePrismaError(error, 'solicitud');
    }
  }

  async list(usuario: UsuarioToken, filters: FiltroSolicitudesDto) {
    await this.ensureActiveUserExists(usuario.id);

    const where = combineRequestFilters(
      ACTIVE_REQUEST_WHERE,
      buildRequestsVisibilityFilter(usuario),
      buildRequestsQueryFilter(filters),
    );

    const requests = await this.prisma.solicitud.findMany({
      where,
      include: REQUEST_INCLUDE,
      orderBy: [{ creadoEn: 'desc' }],
      ...(typeof filters.offset === 'number' ? { skip: filters.offset } : {}),
      ...(typeof filters.limite === 'number' ? { take: filters.limite } : {}),
    });

    return requests.map((request) => presentRequest(request));
  }

  async getDetails(id: number, usuario: UsuarioToken) {
    await this.ensureActiveUserExists(usuario.id);

    const request = await this.prisma.solicitud.findFirst({
      where: {
        id,
        ...ACTIVE_REQUEST_WHERE,
        ...buildRequestsVisibilityFilter(usuario),
      },
      include: {
        ...REQUEST_INCLUDE,
        historialEntradas: {
          include: {
            usuario: SAFE_USER_ARGS,
            areaOrigen: true,
            areaDestino: true,
          },
          orderBy: {
            creadoEn: 'asc',
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    const enrichedHistory = await this.enrichAssignmentHistory(
      request.historialEntradas,
    );

    return presentRequest({
      ...request,
      historialEntradas: enrichedHistory,
    });
  }

  async assignRequest(
    id: number,
    assignRequestDto: AssignRequestDto,
    usuario: UsuarioToken,
  ) {
    const request = await this.ensureActiveRequestExists(id);
    await this.ensureActiveUserExists(usuario.id);
    const assignedUser = await this.validateAssignmentTarget(
      assignRequestDto.asignadoAId,
    );

    validateRequestEditable(request);

    if (request.asignadoAId === assignRequestDto.asignadoAId) {
      throw new BadRequestException(
        'La solicitud ya se encuentra asignada a este usuario',
      );
    }

    await this.updateRequestWithHistory({
      solicitudId: id,
      datosSolicitud: {
        asignadoAId: assignedUser.id,
      },
      history: {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.ASIGNADA,
        asignadoOrigenId: request.asignadoAId,
        asignadoDestinoId: assignedUser.id,
        comentario: assignRequestDto.comentario,
      },
    });

    return this.getDetails(id, usuario);
  }

  async transferRequestToUser(
    id: number,
    transferRequestDto: TransferRequestDto,
    usuario: UsuarioToken,
  ) {
    const request = await this.ensureActiveRequestExists(id);
    await this.ensureActiveUserExists(usuario.id);
    const assignedUser = await this.validateAssignmentTarget(
      transferRequestDto.asignadoAId,
    );

    validateRequestEditable(request);

    if (request.asignadoAId === assignedUser.id) {
      throw new BadRequestException(
        'La solicitud ya se encuentra derivada a este usuario',
      );
    }

    await this.updateRequestWithHistory({
      solicitudId: id,
      datosSolicitud: {
        asignadoAId: assignedUser.id,
        estado: EstadoSolicitud.DERIVADA,
      },
      history: {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.DERIVADA,
        estadoOrigen: request.estado,
        estadoDestino: EstadoSolicitud.DERIVADA,
        asignadoOrigenId: request.asignadoAId,
        asignadoDestinoId: assignedUser.id,
        comentario: transferRequestDto.comentario,
      },
    });

    return this.getDetails(id, usuario);
  }

  async changeRequestStatus(
    id: number,
    changeStatusDto: ChangeStatusDto,
    usuario: UsuarioToken,
  ) {
    const request = await this.ensureActiveRequestExists(id);
    await this.ensureActiveUserExists(usuario.id);
    validateWorkerCanOperateRequest(request, usuario);
    validateRequestEditable(request);

    validateStatusChangeAllowed(
      request,
      changeStatusDto.estado,
      usuario,
    );

    await this.updateRequestWithHistory({
      solicitudId: id,
      datosSolicitud: {
        estado: changeStatusDto.estado,
      },
      history: {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: getHistoryActionForStatusChange(
          changeStatusDto.estado,
        ),
        estadoOrigen: request.estado,
        estadoDestino: changeStatusDto.estado,
        comentario: changeStatusDto.comentario,
      },
    });

    return this.getDetails(id, usuario);
  }

  async addComment(
    id: number,
    addCommentDto: AddCommentDto,
    usuario: UsuarioToken,
  ) {
    const request = await this.ensureActiveRequestExists(id);
    await this.ensureActiveUserExists(usuario.id);
    validateWorkerCanViewRequest(request, usuario);

    await this.registerRequestHistory({
      solicitudId: id,
      usuarioId: usuario.id,
      accion: AccionHistorialSolicitud.OBSERVACION,
      estadoOrigen: request.estado,
      estadoDestino: request.estado,
      asignadoDestinoId: request.asignadoAId,
      comentario: addCommentDto.comentario,
    });

    return this.getDetails(id, usuario);
  }

  async finalizeRequest(
    id: number,
    finalizeRequestDto: FinalizeRequestDto,
    usuario: UsuarioToken,
  ) {
    const request = await this.ensureActiveRequestExists(id);
    await this.ensureActiveUserExists(usuario.id);
    validateWorkerCanOperateRequest(request, usuario);
    validateRequestFinalizable(request);

    await this.updateRequestWithHistory({
      solicitudId: id,
      datosSolicitud: {
        estado: EstadoSolicitud.FINALIZADA,
      },
      history: {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.FINALIZADA,
        estadoOrigen: request.estado,
        estadoDestino: EstadoSolicitud.FINALIZADA,
        comentario: finalizeRequestDto.comentario,
      },
    });

    return this.getDetails(id, usuario);
  }

  async closeRequest(
    id: number,
    closeRequestDto: CloseRequestDto,
    usuario: UsuarioToken,
  ) {
    const request = await this.ensureActiveRequestExists(id);
    await this.ensureActiveUserExists(usuario.id);
    validateRequestClosable(request);

    await this.updateRequestWithHistory({
      solicitudId: id,
      datosSolicitud: {
        estado: EstadoSolicitud.CERRADA,
        fechaCierre: new Date(),
      },
      history: {
        solicitudId: id,
        usuarioId: usuario.id,
        accion: AccionHistorialSolicitud.CERRADA,
        estadoOrigen: request.estado,
        estadoDestino: EstadoSolicitud.CERRADA,
        comentario: closeRequestDto.comentario,
      },
    });

    return this.getDetails(id, usuario);
  }

  async logicallyRemoveRequest(
    id: number,
    actorUsuarioId: number,
    comentario?: string,
  ) {
    const request = await this.ensureActiveRequestExists(id);
    await this.ensureActiveUserExists(actorUsuarioId);

    await this.updateRequestWithHistory({
      solicitudId: id,
      datosSolicitud: {
        eliminadoEn: new Date(),
      },
      history: {
        solicitudId: id,
        usuarioId: actorUsuarioId,
        accion: AccionHistorialSolicitud.ELIMINADA,
        estadoOrigen: request.estado,
        estadoDestino: request.estado,
        asignadoDestinoId: request.asignadoAId,
        comentario,
      },
    });

    return {
      message: `Solicitud ${id} eliminada logicamente`,
    };
  }

  private async ensureActiveRequestExists(id: number) {
    const request = await this.prisma.solicitud.findFirst({
      where: {
        id,
        ...ACTIVE_REQUEST_WHERE,
      },
      include: REQUEST_INCLUDE,
    });

    if (!request) {
      throw new NotFoundException(`Solicitud con id ${id} no encontrada`);
    }

    return request;
  }

  private async ensureActiveUserExists(id: number) {
    const user = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!user || !user.activo) {
      throw new NotFoundException(`Usuario con id ${id} no encontrado`);
    }

    return user;
  }

  private async ensureActiveAreaExists(id: number) {
    const area = await this.prisma.area.findUnique({
      where: { id },
    });

    if (!area || !area.activo) {
      throw new NotFoundException(`Area con id ${id} no encontrada`);
    }

    return area;
  }

  private async ensureActiveRequestTypeExists(id: number) {
    const requestType = await this.prisma.tipoSolicitud.findUnique({
      where: { id },
    });

    if (!requestType || !requestType.activo) {
      throw new NotFoundException(
        `Tipo de solicitud con id ${id} no encontrado`,
      );
    }

    return requestType;
  }

  private async validateAssignmentTarget(assignedUserId: number) {
    const assignedUser = await this.ensureActiveUserExists(assignedUserId);

    if (assignedUser.rol !== RolUsuario.TRABAJADOR) {
      throw new BadRequestException(
        'Solo se puede asignar la solicitud a un usuario con rol TRABAJADOR',
      );
    }

    return assignedUser;
  }

  private calculateDueDateFromSla(slaDays?: number | null) {
    if (!slaDays) {
      throw new BadRequestException(
        'El tipo de solicitud seleccionado no tiene dias SLA configurados',
      );
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + slaDays);
    return dueDate;
  }

  private resolveCurrentAreaId(
    assignedAreaId: number | undefined,
    actorAreaId: number,
  ) {
    return assignedAreaId ?? actorAreaId;
  }

  private normalizeAndValidateExternalReference(externalReference?: string) {
    if (typeof externalReference !== 'string') {
      return undefined;
    }

    const normalizedReference = externalReference.trim();

    if (normalizedReference.length < 1) {
      throw new BadRequestException(
        'La referencia externa no puede estar vacia',
      );
    }

    if (normalizedReference.length > 100) {
      throw new BadRequestException(
        'La referencia externa no puede superar 100 caracteres',
      );
    }

    return normalizedReference;
  }

  private async createRequestWithAvailableSequenceNumber({
    data,
    usuarioId,
    comentario,
  }: {
    data: Omit<Prisma.SolicitudCreateInput, 'correlativo'>;
    usuarioId: number;
    comentario?: string;
  }) {
    // Mantiene compatibilidad con el modelo actual: si hay colision de unicidad,
    // se reintenta y no se generan duplicados silenciosos.
    for (let intento = 0; intento < 3; intento += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const sequenceNumber = await this.getNextSequenceNumber(tx);
          const request = await tx.solicitud.create({
            data: {
              ...data,
              correlativo: sequenceNumber,
            },
          });

          await this.createHistoryEntry(tx, {
            solicitudId: request.id,
            usuarioId,
            accion: AccionHistorialSolicitud.CREADA,
            estadoDestino: request.estado,
            asignadoDestinoId: request.asignadoAId,
            comentario,
          });

          return request;
        });
      } catch (error) {
        if (this.isSequenceNumberConflict(error) && intento < 2) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException('No fue posible generar el correlativo');
  }

  private async getNextSequenceNumber(tx: Prisma.TransactionClient) {
    const result = await tx.solicitud.aggregate({
      _max: {
        correlativo: true,
      },
    });

    return (result._max.correlativo ?? 0) + 1;
  }

  private isSequenceNumberConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes('correlativo')
    );
  }

  private async enrichAssignmentHistory<
    T extends Array<{
      asignadoOrigenId?: number | null;
      asignadoDestinoId?: number | null;
    }>,
  >(history: T) {
    const userIds = Array.from(
      new Set(
        history.flatMap((entry) =>
          [entry.asignadoOrigenId, entry.asignadoDestinoId].filter(
            (id): id is number => typeof id === 'number',
          ),
        ),
      ),
    );

    if (userIds.length === 0) {
      return history;
    }

    const users = await this.prisma.usuario.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      include: {
        area: true,
      },
      omit: SAFE_USER_ARGS.omit,
    });

    const usersById = new Map(users.map((item) => [item.id, item]));

    return history.map((entry) => ({
      ...entry,
      asignadoOrigen: entry.asignadoOrigenId
        ? (usersById.get(entry.asignadoOrigenId) ?? null)
        : null,
      asignadoDestino: entry.asignadoDestinoId
        ? (usersById.get(entry.asignadoDestinoId) ?? null)
        : null,
    }));
  }

  private createHistoryEntry(
    tx: Prisma.TransactionClient,
    data: RequestHistoryData,
  ) {
    return tx.historialSolicitud.create({ data });
  }

  private async registerRequestHistory(data: RequestHistoryData) {
    await this.prisma.$transaction(async (tx) => {
      await this.createHistoryEntry(tx, data);
    });
  }

  private async updateRequestWithHistory({
    solicitudId,
    datosSolicitud,
    history,
  }: {
    solicitudId: number;
    datosSolicitud?: Prisma.SolicitudUncheckedUpdateInput;
    history: RequestHistoryData;
  }) {
    await this.prisma.$transaction(async (tx) => {
      if (datosSolicitud) {
        await tx.solicitud.update({
          where: { id: solicitudId },
          data: datosSolicitud,
        });
      }

      await this.createHistoryEntry(tx, history);
    });
  }
}
