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
  areaActualId: number;
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

function esRolTrabajador(usuario: UsuarioToken) {
  return usuario.rol === RolUsuario.TRABAJADOR;
}

export function validarTrabajadorPuedeVerSolicitud(
  solicitud: SolicitudVisibleParaTrabajador,
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

export function validarTrabajadorPuedeOperarSolicitud(
  solicitud: SolicitudOperablePorTrabajador,
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

export function validarSolicitudEditable(solicitud: SolicitudEditable) {
  if (solicitud.estado === EstadoSolicitud.CERRADA) {
    throw new BadRequestException(
      'La solicitud esta cerrada y ya no admite modificaciones',
    );
  }
}

export function validarAsignacionRequeridaParaEstado(
  estado: EstadoSolicitud,
  asignadoAId: number | null,
) {
  if (ESTADOS_REQUIEREN_ASIGNADO.has(estado) && !asignadoAId) {
    throw new BadRequestException(
      'La solicitud debe estar asignada a un trabajador para usar este estado',
    );
  }
}

export function validarCambioEstadoPermitido(
  solicitud: SolicitudCambioEstado,
  estadoDestino: EstadoSolicitud,
  usuario: UsuarioToken,
) {
  if (
    esRolTrabajador(usuario) &&
    solicitud.estado === EstadoSolicitud.FINALIZADA
  ) {
    throw new BadRequestException(
      'La solicitud ya fue finalizada y solo puede ser cerrada por un encargado o reemplazo',
    );
  }

  if (estadoDestino === EstadoSolicitud.CERRADA) {
    throw new BadRequestException(
      'Use el metodo cerrarSolicitud para estos cambios de estado',
    );
  }

  if (esRolTrabajador(usuario) && estadoDestino === EstadoSolicitud.FINALIZADA) {
    throw new BadRequestException(
      'Use el metodo finalizarSolicitud para marcar la solicitud como FINALIZADA',
    );
  }

  if (estadoDestino === EstadoSolicitud.VENCIDA) {
    throw new BadRequestException(
      'El estado VENCIDA se determina automaticamente segun la fecha de vencimiento',
    );
  }

  if (estadoDestino === EstadoSolicitud.DERIVADA) {
    throw new BadRequestException(
      'Use el metodo derivarSolicitudAArea para derivar solicitudes',
    );
  }

  if (solicitud.estado === estadoDestino) {
    throw new BadRequestException('La solicitud ya tiene este estado');
  }

  validarAsignacionRequeridaParaEstado(estadoDestino, solicitud.asignadoAId);
}

export function validarSolicitudFinalizable(
  solicitud: SolicitudCambioEstado,
) {
  validarSolicitudEditable(solicitud);
  validarAsignacionRequeridaParaEstado(
    EstadoSolicitud.FINALIZADA,
    solicitud.asignadoAId,
  );

  if (solicitud.estado === EstadoSolicitud.FINALIZADA) {
    throw new BadRequestException('La solicitud ya se encuentra finalizada');
  }
}

export function validarSolicitudCerrable(solicitud: SolicitudCerrable) {
  if (solicitud.estado === EstadoSolicitud.CERRADA) {
    throw new BadRequestException('La solicitud ya se encuentra cerrada');
  }

  if (solicitud.estado !== EstadoSolicitud.FINALIZADA) {
    throw new BadRequestException(
      'Solo se puede cerrar una solicitud que este en estado FINALIZADA',
    );
  }
}

export function obtenerAccionHistorialCambioEstado(
  estadoDestino: EstadoSolicitud,
) {
  return estadoDestino === EstadoSolicitud.FINALIZADA
    ? AccionHistorialSolicitud.FINALIZADA
    : AccionHistorialSolicitud.ESTADO_CAMBIADO;
}
