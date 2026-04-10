import * as bcrypt from 'bcrypt';
import {
  AccionHistorialSolicitud,
  EstadoSolicitud,
  PrismaClient,
  PrioridadSolicitud,
  RolUsuario,
} from '@prisma/client';

const prisma = new PrismaClient();
const CONTRASENA_DEMO = 'Demo1234!';

const areasBase = [
  {
    nombre: 'Oficina de Partes',
    descripcion: 'Recepcion, registro y distribucion formal de documentos.',
  },
  {
    nombre: 'Secretaria',
    descripcion: 'Coordinacion administrativa y apoyo a alcaldia y direcciones.',
  },
  {
    nombre: 'Atencion al Publico',
    descripcion: 'Primer contacto con vecinas y vecinos para consultas y tramites.',
  },
  {
    nombre: 'Obras',
    descripcion: 'Revision de permisos, obras menores y materias tecnicas urbanas.',
  },
  {
    nombre: 'Transito',
    descripcion: 'Gestion de permisos, senaletica y antecedentes de circulacion.',
  },
  {
    nombre: 'Juridico',
    descripcion: 'Analisis legal, oficios y apoyo normativo institucional.',
  },
  {
    nombre: 'Finanzas',
    descripcion: 'Pagos, ingresos municipales y seguimiento presupuestario.',
  },
  {
    nombre: 'DIDECO',
    descripcion: 'Programas sociales, ayudas y atencion comunitaria.',
  },
  {
    nombre: 'Aseo y Ornato',
    descripcion: 'Mantencion de espacios publicos, aseo y gestion ambiental.',
  },
];

const tiposSolicitudBase = [
  {
    nombre: 'Solicitud ciudadana',
    descripcion: 'Requerimientos o peticiones formales presentadas por la comunidad.',
    diasSla: 10,
  },
  {
    nombre: 'Memorandum interno',
    descripcion: 'Comunicacion interna entre unidades municipales.',
    diasSla: 5,
  },
  {
    nombre: 'Certificado',
    descripcion: 'Emision de certificados y constancias administrativas.',
    diasSla: 3,
  },
  {
    nombre: 'Derivacion interna',
    descripcion: 'Traslado formal de antecedentes entre areas municipales.',
    diasSla: 4,
  },
  {
    nombre: 'Reclamo',
    descripcion: 'Ingreso y seguimiento de reclamos ciudadanos.',
    diasSla: 7,
  },
  {
    nombre: 'Consulta',
    descripcion: 'Consultas internas o ciudadanas que requieren respuesta formal.',
    diasSla: 5,
  },
  {
    nombre: 'Permiso',
    descripcion: 'Solicitudes de autorizacion municipal o administrativa.',
    diasSla: 12,
  },
  {
    nombre: 'Oficio',
    descripcion: 'Emision o recepcion de oficios con tramitacion municipal.',
    diasSla: 8,
  },
];

const usuariosBase = [
  {
    nombres: 'Carolina',
    apellidos: 'Munoz',
    email: 'encargado@demo.cl',
    telefono: '+56911110001',
    rol: RolUsuario.ENCARGADO,
    area: 'Secretaria',
  },
  {
    nombres: 'Felipe',
    apellidos: 'Rojas',
    email: 'reemplazo@demo.cl',
    telefono: '+56911110002',
    rol: RolUsuario.REEMPLAZO,
    area: 'Secretaria',
  },
  {
    nombres: 'Daniela',
    apellidos: 'Perez',
    email: 'trabajador.partes@demo.cl',
    telefono: '+56911110003',
    rol: RolUsuario.TRABAJADOR,
    area: 'Oficina de Partes',
  },
  {
    nombres: 'Marcelo',
    apellidos: 'Vega',
    email: 'trabajador.atencion@demo.cl',
    telefono: '+56911110004',
    rol: RolUsuario.TRABAJADOR,
    area: 'Atencion al Publico',
  },
  {
    nombres: 'Paula',
    apellidos: 'Soto',
    email: 'trabajador.obras@demo.cl',
    telefono: '+56911110005',
    rol: RolUsuario.TRABAJADOR,
    area: 'Obras',
  },
  {
    nombres: 'Javier',
    apellidos: 'Araya',
    email: 'trabajador.transito@demo.cl',
    telefono: '+56911110006',
    rol: RolUsuario.TRABAJADOR,
    area: 'Transito',
  },
  {
    nombres: 'Camila',
    apellidos: 'Torres',
    email: 'trabajador.juridico@demo.cl',
    telefono: '+56911110007',
    rol: RolUsuario.TRABAJADOR,
    area: 'Juridico',
  },
  {
    nombres: 'Ignacio',
    apellidos: 'Leiva',
    email: 'trabajador.finanzas@demo.cl',
    telefono: '+56911110008',
    rol: RolUsuario.TRABAJADOR,
    area: 'Finanzas',
  },
  {
    nombres: 'Francisca',
    apellidos: 'Gutierrez',
    email: 'trabajador.dideco@demo.cl',
    telefono: '+56911110009',
    rol: RolUsuario.TRABAJADOR,
    area: 'DIDECO',
  },
  {
    nombres: 'Luis',
    apellidos: 'Contreras',
    email: 'trabajador.aseo@demo.cl',
    telefono: '+56911110010',
    rol: RolUsuario.TRABAJADOR,
    area: 'Aseo y Ornato',
  },
];

function diasDesdeHoy(dias: number) {
  const fecha = new Date();
  fecha.setHours(9, 0, 0, 0);
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

async function crearHistorialSolicitud(params: {
  solicitudId: number;
  usuarioId: number;
  accion: AccionHistorialSolicitud;
  estadoOrigen?: EstadoSolicitud | null;
  estadoDestino?: EstadoSolicitud | null;
  areaOrigenId?: number | null;
  areaDestinoId?: number | null;
  asignadoOrigenId?: number | null;
  asignadoDestinoId?: number | null;
  comentario?: string;
}) {
  await prisma.historialSolicitud.create({
    data: {
      solicitudId: params.solicitudId,
      usuarioId: params.usuarioId,
      accion: params.accion,
      estadoOrigen: params.estadoOrigen ?? null,
      estadoDestino: params.estadoDestino ?? null,
      areaOrigenId: params.areaOrigenId ?? null,
      areaDestinoId: params.areaDestinoId ?? null,
      asignadoOrigenId: params.asignadoOrigenId ?? null,
      asignadoDestinoId: params.asignadoDestinoId ?? null,
      comentario: params.comentario,
    },
  });
}

async function main() {
  await prisma.historialSolicitud.deleteMany();
  await prisma.solicitud.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.tipoSolicitud.deleteMany();
  await prisma.area.deleteMany();

  await prisma.area.createMany({
    data: areasBase.map((area) => ({
      ...area,
      activo: true,
    })),
  });

  const areas = await prisma.area.findMany();
  const areasPorNombre = new Map(areas.map((area) => [area.nombre, area]));

  const contrasenaHasheada = await bcrypt.hash(CONTRASENA_DEMO, 10);

  await prisma.usuario.createMany({
    data: usuariosBase.map((usuario) => {
      const area = areasPorNombre.get(usuario.area);

      if (!area) {
        throw new Error(`No se encontro el area ${usuario.area}`);
      }

      return {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        contrasena: contrasenaHasheada,
        telefono: usuario.telefono,
        rol: usuario.rol,
        areaId: area.id,
        activo: true,
      };
    }),
  });

  await prisma.tipoSolicitud.createMany({
    data: tiposSolicitudBase.map((tipo) => ({
      ...tipo,
      activo: true,
    })),
  });

  const usuarios = await prisma.usuario.findMany();
  const tiposSolicitud = await prisma.tipoSolicitud.findMany();

  const usuariosPorCorreo = new Map(usuarios.map((usuario) => [usuario.email, usuario]));
  const tiposPorNombre = new Map(
    tiposSolicitud.map((tipoSolicitud) => [tipoSolicitud.nombre, tipoSolicitud]),
  );

  const encargado = usuariosPorCorreo.get('encargado@demo.cl');
  const reemplazo = usuariosPorCorreo.get('reemplazo@demo.cl');
  const trabajadorPartes = usuariosPorCorreo.get('trabajador.partes@demo.cl');
  const trabajadorAtencion = usuariosPorCorreo.get('trabajador.atencion@demo.cl');
  const trabajadorObras = usuariosPorCorreo.get('trabajador.obras@demo.cl');
  const trabajadorTransito = usuariosPorCorreo.get('trabajador.transito@demo.cl');
  const trabajadorJuridico = usuariosPorCorreo.get('trabajador.juridico@demo.cl');
  const trabajadorFinanzas = usuariosPorCorreo.get('trabajador.finanzas@demo.cl');
  const trabajadorDideco = usuariosPorCorreo.get('trabajador.dideco@demo.cl');

  if (
    !encargado ||
    !reemplazo ||
    !trabajadorPartes ||
    !trabajadorAtencion ||
    !trabajadorObras ||
    !trabajadorTransito ||
    !trabajadorJuridico ||
    !trabajadorFinanzas ||
    !trabajadorDideco
  ) {
    throw new Error('No se pudieron resolver los usuarios base del seed.');
  }

  const solicitudIngresada = await prisma.solicitud.create({
    data: {
      titulo: 'Ingreso de antecedentes para actividad vecinal',
      descripcion:
        'La junta de vecinos solicita registrar antecedentes y respaldos para actividad comunitaria del fin de semana.',
      estado: EstadoSolicitud.INGRESADA,
      prioridad: PrioridadSolicitud.MEDIA,
      fechaVencimiento: diasDesdeHoy(4),
      creadoPorId: encargado.id,
      areaActualId: areasPorNombre.get('Oficina de Partes')!.id,
      tipoSolicitudId: tiposPorNombre.get('Solicitud ciudadana')!.id,
    },
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudIngresada.id,
    usuarioId: encargado.id,
    accion: AccionHistorialSolicitud.CREADA,
    estadoDestino: EstadoSolicitud.INGRESADA,
    areaDestinoId: areasPorNombre.get('Oficina de Partes')!.id,
    comentario: 'Solicitud ingresada por mesa central para revision inicial.',
  });

  const solicitudDerivada = await prisma.solicitud.create({
    data: {
      titulo: 'Consulta sobre instalacion de reductor de velocidad',
      descripcion:
        'Vecinos del pasaje Los Tilos solicitan evaluar medidas de seguridad vial frente a la sede vecinal.',
      estado: EstadoSolicitud.DERIVADA,
      prioridad: PrioridadSolicitud.ALTA,
      fechaVencimiento: diasDesdeHoy(6),
      creadoPorId: reemplazo.id,
      areaActualId: areasPorNombre.get('Transito')!.id,
      tipoSolicitudId: tiposPorNombre.get('Derivacion interna')!.id,
    },
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudDerivada.id,
    usuarioId: reemplazo.id,
    accion: AccionHistorialSolicitud.CREADA,
    estadoDestino: EstadoSolicitud.INGRESADA,
    areaDestinoId: areasPorNombre.get('Atencion al Publico')!.id,
    comentario: 'Solicitud recibida desde plataforma de atencion ciudadana.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudDerivada.id,
    usuarioId: reemplazo.id,
    accion: AccionHistorialSolicitud.DERIVADA,
    estadoOrigen: EstadoSolicitud.INGRESADA,
    estadoDestino: EstadoSolicitud.DERIVADA,
    areaOrigenId: areasPorNombre.get('Atencion al Publico')!.id,
    areaDestinoId: areasPorNombre.get('Transito')!.id,
    comentario: 'Derivada a Transito para evaluacion tecnica.',
  });

  const solicitudEnProceso = await prisma.solicitud.create({
    data: {
      titulo: 'Revision de permiso provisorio para feria barrial',
      descripcion:
        'Se requiere revisar antecedentes y autorizaciones para feria barrial de fin de mes.',
      estado: EstadoSolicitud.EN_PROCESO,
      prioridad: PrioridadSolicitud.ALTA,
      fechaVencimiento: diasDesdeHoy(5),
      creadoPorId: encargado.id,
      asignadoAId: trabajadorObras.id,
      areaActualId: areasPorNombre.get('Obras')!.id,
      tipoSolicitudId: tiposPorNombre.get('Permiso')!.id,
    },
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudEnProceso.id,
    usuarioId: encargado.id,
    accion: AccionHistorialSolicitud.CREADA,
    estadoDestino: EstadoSolicitud.INGRESADA,
    areaDestinoId: areasPorNombre.get('Obras')!.id,
    comentario: 'Ingreso de permiso para revision tecnica.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudEnProceso.id,
    usuarioId: encargado.id,
    accion: AccionHistorialSolicitud.ASIGNADA,
    asignadoDestinoId: trabajadorObras.id,
    comentario: 'Asignada a profesional de Obras para analisis.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudEnProceso.id,
    usuarioId: trabajadorObras.id,
    accion: AccionHistorialSolicitud.ESTADO_CAMBIADO,
    estadoOrigen: EstadoSolicitud.INGRESADA,
    estadoDestino: EstadoSolicitud.EN_PROCESO,
    comentario: 'Antecedentes en revision y visita tecnica coordinada.',
  });

  const solicitudPendiente = await prisma.solicitud.create({
    data: {
      titulo: 'Reclamo por retiro incompleto de residuos voluminosos',
      descripcion:
        'Se solicita complementar retiro de residuos en sector Villa Esperanza y confirmar fecha de nueva visita.',
      estado: EstadoSolicitud.PENDIENTE_INFORMACION,
      prioridad: PrioridadSolicitud.MEDIA,
      fechaVencimiento: diasDesdeHoy(2),
      creadoPorId: reemplazo.id,
      asignadoAId: trabajadorDideco.id,
      areaActualId: areasPorNombre.get('DIDECO')!.id,
      tipoSolicitudId: tiposPorNombre.get('Reclamo')!.id,
    },
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudPendiente.id,
    usuarioId: reemplazo.id,
    accion: AccionHistorialSolicitud.CREADA,
    estadoDestino: EstadoSolicitud.INGRESADA,
    areaDestinoId: areasPorNombre.get('DIDECO')!.id,
    comentario: 'Reclamo ingresado por dirigenta social del sector.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudPendiente.id,
    usuarioId: reemplazo.id,
    accion: AccionHistorialSolicitud.ASIGNADA,
    asignadoDestinoId: trabajadorDideco.id,
    comentario: 'Asignada para coordinacion con cuadrilla y familia afectada.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudPendiente.id,
    usuarioId: trabajadorDideco.id,
    accion: AccionHistorialSolicitud.ESTADO_CAMBIADO,
    estadoOrigen: EstadoSolicitud.INGRESADA,
    estadoDestino: EstadoSolicitud.PENDIENTE_INFORMACION,
    comentario: 'Se solicitaron fotografias y direccion exacta para reprogramar retiro.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudPendiente.id,
    usuarioId: trabajadorDideco.id,
    accion: AccionHistorialSolicitud.OBSERVACION,
    estadoOrigen: EstadoSolicitud.PENDIENTE_INFORMACION,
    estadoDestino: EstadoSolicitud.PENDIENTE_INFORMACION,
    areaDestinoId: areasPorNombre.get('DIDECO')!.id,
    asignadoDestinoId: trabajadorDideco.id,
    comentario: 'La vecina indico que enviara antecedentes complementarios durante la tarde.',
  });

  const solicitudFinalizada = await prisma.solicitud.create({
    data: {
      titulo: 'Emision de certificado de residencia para programa social',
      descripcion:
        'Se requiere certificado simple de residencia para presentacion en programa de apoyo familiar.',
      estado: EstadoSolicitud.FINALIZADA,
      prioridad: PrioridadSolicitud.BAJA,
      fechaVencimiento: diasDesdeHoy(1),
      creadoPorId: encargado.id,
      asignadoAId: trabajadorAtencion.id,
      areaActualId: areasPorNombre.get('Atencion al Publico')!.id,
      tipoSolicitudId: tiposPorNombre.get('Certificado')!.id,
    },
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudFinalizada.id,
    usuarioId: encargado.id,
    accion: AccionHistorialSolicitud.CREADA,
    estadoDestino: EstadoSolicitud.INGRESADA,
    areaDestinoId: areasPorNombre.get('Atencion al Publico')!.id,
    comentario: 'Solicitud recepcionada desde modulo presencial.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudFinalizada.id,
    usuarioId: encargado.id,
    accion: AccionHistorialSolicitud.ASIGNADA,
    asignadoDestinoId: trabajadorAtencion.id,
    comentario: 'Asignada para verificacion de domicilio y emision.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudFinalizada.id,
    usuarioId: trabajadorAtencion.id,
    accion: AccionHistorialSolicitud.ESTADO_CAMBIADO,
    estadoOrigen: EstadoSolicitud.INGRESADA,
    estadoDestino: EstadoSolicitud.EN_PROCESO,
    comentario: 'Antecedentes revisados y en preparacion de documento.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudFinalizada.id,
    usuarioId: trabajadorAtencion.id,
    accion: AccionHistorialSolicitud.FINALIZADA,
    estadoOrigen: EstadoSolicitud.EN_PROCESO,
    estadoDestino: EstadoSolicitud.FINALIZADA,
    comentario: 'Certificado emitido y disponible para retiro.',
  });

  const fechaCierre = diasDesdeHoy(-1);
  const solicitudCerrada = await prisma.solicitud.create({
    data: {
      titulo: 'Pago pendiente a proveedor de suministro de oficina',
      descripcion:
        'Regularizacion de pago por compra de resmas y carpetas administrativas del mes anterior.',
      estado: EstadoSolicitud.CERRADA,
      prioridad: PrioridadSolicitud.MEDIA,
      fechaVencimiento: diasDesdeHoy(-4),
      fechaCierre,
      creadoPorId: reemplazo.id,
      asignadoAId: trabajadorFinanzas.id,
      areaActualId: areasPorNombre.get('Finanzas')!.id,
      tipoSolicitudId: tiposPorNombre.get('Memorandum interno')!.id,
    },
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudCerrada.id,
    usuarioId: reemplazo.id,
    accion: AccionHistorialSolicitud.CREADA,
    estadoDestino: EstadoSolicitud.INGRESADA,
    areaDestinoId: areasPorNombre.get('Finanzas')!.id,
    comentario: 'Memorandum interno para regularizacion de pago.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudCerrada.id,
    usuarioId: reemplazo.id,
    accion: AccionHistorialSolicitud.ASIGNADA,
    asignadoDestinoId: trabajadorFinanzas.id,
    comentario: 'Asignada a analista de Finanzas para gestion contable.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudCerrada.id,
    usuarioId: trabajadorFinanzas.id,
    accion: AccionHistorialSolicitud.ESTADO_CAMBIADO,
    estadoOrigen: EstadoSolicitud.INGRESADA,
    estadoDestino: EstadoSolicitud.EN_PROCESO,
    comentario: 'Se verificaron facturas y orden de compra asociada.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudCerrada.id,
    usuarioId: trabajadorFinanzas.id,
    accion: AccionHistorialSolicitud.FINALIZADA,
    estadoOrigen: EstadoSolicitud.EN_PROCESO,
    estadoDestino: EstadoSolicitud.FINALIZADA,
    comentario: 'Pago cursado y respaldo adjuntado al expediente.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudCerrada.id,
    usuarioId: encargado.id,
    accion: AccionHistorialSolicitud.CERRADA,
    estadoOrigen: EstadoSolicitud.FINALIZADA,
    estadoDestino: EstadoSolicitud.CERRADA,
    comentario: 'Solicitud cerrada por conformidad de la unidad solicitante.',
  });

  const solicitudVencida = await prisma.solicitud.create({
    data: {
      titulo: 'Analisis juridico de ocupacion de bien nacional de uso publico',
      descripcion:
        'Se requiere pronunciamiento sobre ocupacion reiterada de vereda por local comercial del sector centro.',
      estado: EstadoSolicitud.VENCIDA,
      prioridad: PrioridadSolicitud.URGENTE,
      fechaVencimiento: diasDesdeHoy(-3),
      creadoPorId: encargado.id,
      asignadoAId: trabajadorJuridico.id,
      areaActualId: areasPorNombre.get('Juridico')!.id,
      tipoSolicitudId: tiposPorNombre.get('Oficio')!.id,
    },
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudVencida.id,
    usuarioId: encargado.id,
    accion: AccionHistorialSolicitud.CREADA,
    estadoDestino: EstadoSolicitud.INGRESADA,
    areaDestinoId: areasPorNombre.get('Juridico')!.id,
    comentario: 'Oficio interno ingresado para revision legal.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudVencida.id,
    usuarioId: encargado.id,
    accion: AccionHistorialSolicitud.ASIGNADA,
    asignadoDestinoId: trabajadorJuridico.id,
    comentario: 'Asignada a profesional juridico de turno.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudVencida.id,
    usuarioId: trabajadorJuridico.id,
    accion: AccionHistorialSolicitud.ESTADO_CAMBIADO,
    estadoOrigen: EstadoSolicitud.INGRESADA,
    estadoDestino: EstadoSolicitud.EN_PROCESO,
    comentario: 'Se solicitaron antecedentes adicionales a Inspeccion Municipal.',
  });

  await crearHistorialSolicitud({
    solicitudId: solicitudVencida.id,
    usuarioId: encargado.id,
    accion: AccionHistorialSolicitud.ESTADO_CAMBIADO,
    estadoOrigen: EstadoSolicitud.EN_PROCESO,
    estadoDestino: EstadoSolicitud.VENCIDA,
    comentario: 'La solicitud supero su plazo sin cierre del expediente.',
  });

  console.log('Seed municipal completado correctamente.');
  console.log('Usuarios principales:');
  console.log(' - encargado@demo.cl');
  console.log(' - reemplazo@demo.cl');
  console.log(' - trabajador.partes@demo.cl');
  console.log(' - trabajador.atencion@demo.cl');
  console.log(' - trabajador.obras@demo.cl');
  console.log(' - trabajador.transito@demo.cl');
  console.log(' - trabajador.juridico@demo.cl');
  console.log(' - trabajador.finanzas@demo.cl');
  console.log(' - trabajador.dideco@demo.cl');
  console.log(' - trabajador.aseo@demo.cl');
}

main()
  .catch((error) => {
    console.error('Error al ejecutar seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
