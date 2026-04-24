import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AccionHistorialSolicitud,
  EstadoSolicitud,
  RolUsuario,
} from '@prisma/client';
import type { UsuarioToken } from '../autenticacion/interfaces/usuario-token.interface';

const ESTADOS_REQUIEREN_ASIGNADO = new Set<EstadoSolicitud>([
  EstadoSolicitud.EN_PROCESO,
  EstadoSolicitud.PENDIENTE_INFORMACION,
  EstadoSolicitud.FINALIZADA,
]);

type SolicitudVisibleParaTrabajador = {
  asignadoAId: number | null;
};

type SolicitudOperablePorTrabajador = {
  asignadoAId: number | null;
};

type SolicitudEditable = {
  estado: EstadoSolicitud;
};

type SolicitudCambioEstado = SolicitudEditable & SolicitudOperablePorTrabajador;

type SolicitudCerrable = {
  estado: EstadoSolicitud;
};

function isWorkerRole(user: UsuarioToken) {
  return user.rol === RolUsuario.TRABAJADOR;
}

export function validateWorkerCanViewRequest(
  request: SolicitudVisibleParaTrabajador,
  user: UsuarioToken,
) {
  if (user.rol === RolUsuario.TRABAJADOR && request.asignadoAId !== user.id) {
    throw new ForbiddenException(
      'No tiene permisos para acceder a esta solicitud',
    );
  }
}

export function validateWorkerCanOperateRequest(
  request: SolicitudOperablePorTrabajador,
  user: UsuarioToken,
) {
  if (
    user.rol === RolUsuario.TRABAJADOR &&
    request.asignadoAId !== user.id
  ) {
    throw new ForbiddenException(
      'Solo el trabajador asignado puede operar esta solicitud',
    );
  }
}

export function validateRequestEditable(request: SolicitudEditable) {
  if (request.estado === EstadoSolicitud.CERRADA) {
    throw new BadRequestException(
      'La solicitud esta cerrada y ya no admite modificaciones',
    );
  }
}

export function validateAssignmentRequiredForStatus(
  status: EstadoSolicitud,
  assignedUserId: number | null,
) {
  if (ESTADOS_REQUIEREN_ASIGNADO.has(status) && !assignedUserId) {
    throw new BadRequestException(
      'La solicitud debe estar asignada a un trabajador para usar este estado',
    );
  }
}

export function validateStatusChangeAllowed(
  request: SolicitudCambioEstado,
  destinationStatus: EstadoSolicitud,
  user: UsuarioToken,
) {
  if (
    isWorkerRole(user) &&
    request.estado === EstadoSolicitud.FINALIZADA
  ) {
    throw new BadRequestException(
      'La solicitud ya fue finalizada y solo puede ser cerrada por un encargado o reemplazo',
    );
  }

  if (destinationStatus === EstadoSolicitud.CERRADA) {
    throw new BadRequestException(
      'Use el metodo cerrarSolicitud para estos cambios de estado',
    );
  }

  if (isWorkerRole(user) && destinationStatus === EstadoSolicitud.FINALIZADA) {
    throw new BadRequestException(
      'Use el metodo finalizarSolicitud para marcar la solicitud como FINALIZADA',
    );
  }

  if (destinationStatus === EstadoSolicitud.VENCIDA) {
    throw new BadRequestException(
      'El estado VENCIDA se determina automaticamente segun la fecha de vencimiento',
    );
  }

  if (destinationStatus === EstadoSolicitud.DERIVADA) {
    throw new BadRequestException(
      'Use el metodo derivarSolicitud para derivar solicitudes',
    );
  }

  if (request.estado === destinationStatus) {
    throw new BadRequestException('La solicitud ya tiene este estado');
  }

  validateAssignmentRequiredForStatus(destinationStatus, request.asignadoAId);
}

export function validateRequestFinalizable(
  request: SolicitudCambioEstado,
) {
  validateRequestEditable(request);
  validateAssignmentRequiredForStatus(
    EstadoSolicitud.FINALIZADA,
    request.asignadoAId,
  );

  if (request.estado === EstadoSolicitud.FINALIZADA) {
    throw new BadRequestException('La solicitud ya se encuentra finalizada');
  }
}

export function validateRequestClosable(request: SolicitudCerrable) {
  if (request.estado === EstadoSolicitud.CERRADA) {
    throw new BadRequestException('La solicitud ya se encuentra cerrada');
  }

  if (request.estado !== EstadoSolicitud.FINALIZADA) {
    throw new BadRequestException(
      'Solo se puede cerrar una solicitud que este en estado FINALIZADA',
    );
  }
}

export function getHistoryActionForStatusChange(
  destinationStatus: EstadoSolicitud,
) {
  return destinationStatus === EstadoSolicitud.FINALIZADA
    ? AccionHistorialSolicitud.FINALIZADA
    : AccionHistorialSolicitud.ESTADO_CAMBIADO;
}
