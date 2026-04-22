import { EstadoSolicitud, Prisma } from '@prisma/client';
import { FiltroSolicitudesDto } from './dto/filtro-solicitudes.dto';

export const ACTIVE_REQUEST_WHERE = {
  eliminadoEn: null,
} satisfies Prisma.SolicitudWhereInput;

export function construirFiltroConsultaSolicitudes(
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

export function combinarFiltrosSolicitud(
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
