import { EstadoSolicitud, Prisma } from '@prisma/client';
import { FiltroSolicitudesDto } from './dto/filtro-solicitudes.dto';

export const ACTIVE_REQUEST_WHERE = {
  eliminadoEn: null,
} satisfies Prisma.SolicitudWhereInput;

export function buildRequestsQueryFilter(
  filters: FiltroSolicitudesDto,
): Prisma.SolicitudWhereInput {
  const search = filters.busqueda?.trim();
  const filtersOverdue = filters.estado === EstadoSolicitud.VENCIDA;

  return {
    ...(filters.estado && !filtersOverdue ? { estado: filters.estado } : {}),
    ...(filters.prioridad ? { prioridad: filters.prioridad } : {}),
    ...(filters.tipoSolicitudId
      ? { tipoSolicitudId: filters.tipoSolicitudId }
      : {}),
    ...(filtersOverdue
      ? {
          fechaCierre: null,
          fechaVencimiento: {
            lt: new Date(),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { numeroSolicitud: { contains: search, mode: 'insensitive' } },
            { titulo: { contains: search, mode: 'insensitive' } },
            { descripcion: { contains: search, mode: 'insensitive' } },
            {
              tipoSolicitud: {
                nombre: { contains: search, mode: 'insensitive' },
              },
            },
            {
              asignadoA: {
                OR: [
                  { nombres: { contains: search, mode: 'insensitive' } },
                  { apellidos: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
            ...(Number.isInteger(Number(search))
              ? [{ id: Number(search) }, { correlativo: Number(search) }]
              : []),
          ],
        }
      : {}),
  };
}

export function combineRequestFilters(
  ...filters: Prisma.SolicitudWhereInput[]
): Prisma.SolicitudWhereInput {
  const activeFilters = filters.filter((filter) => Object.keys(filter).length);

  if (activeFilters.length === 0) {
    return {};
  }

  if (activeFilters.length === 1) {
    return activeFilters[0];
  }

  return {
    AND: activeFilters,
  };
}
