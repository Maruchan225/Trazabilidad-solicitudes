import 'dotenv/config';
import { InputChannel, PrismaClient, Priority, TicketHistoryAction, TicketStatus, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

function assertDestructiveSeedAllowed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('The demo seed is disabled in production. Restore from backups or use migrations instead.');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required to run the seed.');
  }
  if (process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error('This seed deletes and recreates demo data. Set ALLOW_DESTRUCTIVE_SEED=true to run it intentionally.');
  }
}

assertDestructiveSeedAllowed();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const password = '11223344';
const totalTickets = 3000;
const featuredWorkerEmail = 'trabajador.uno@demo.cl';

const ticketTypeSeeds = [
  { name: 'Certificado de regularizacion', description: 'Solicitudes de certificados DOM y regularizacion.', slaDays: 5 },
  { name: 'Revision de expediente', description: 'Revision tecnica y administrativa de expedientes.', slaDays: 10 },
  { name: 'Inspeccion de obra', description: 'Solicitudes de inspeccion en terreno.', slaDays: 15 },
  { name: 'Permiso de edificacion', description: 'Tramitacion y seguimiento de permisos de edificacion.', slaDays: 20 },
  { name: 'Recepcion final', description: 'Solicitudes asociadas a recepcion final de obras.', slaDays: 12 },
];

const titlePool = [
  'Solicitud de certificado',
  'Revision de antecedentes',
  'Inspeccion programada',
  'Consulta por permiso',
  'Regularizacion de obra menor',
  'Ingreso de expediente tecnico',
  'Solicitud de recepcion final',
  'Revision de planos',
  'Correccion de observaciones',
  'Solicitud presencial DOM',
];

const descriptionPool = [
  'Solicitud generada para pruebas de trazabilidad y seguimiento DOM.',
  'Caso de ejemplo con antecedentes pendientes de revision tecnica.',
  'Registro de prueba para validar filtros, reportes y carga por trabajador.',
  'Solicitud ingresada por canal institucional para seguimiento interno.',
  'Expediente con observaciones de planimetria y antecedentes municipales.',
  'Requerimiento urgente asociado a una visita tecnica pendiente.',
  'Solicitud con documentacion completa y seguimiento administrativo.',
  'Caso ciudadano con plazo controlado y prioridad de regularizacion.',
];

const requesterNames = [
  'Camila Rojas',
  'Felipe Munoz',
  'Valentina Soto',
  'Jorge Herrera',
  'Daniela Vega',
  'Matias Contreras',
  'Paula Fuentes',
  'Rodrigo Silva',
  'Fernanda Araya',
  'Cristian Morales',
];

const requesterDomains = ['correo.cl', 'municipio.cl', 'vecinos.cl', 'empresa.cl'];

function seededRut(index: number) {
  const base = 10_000_000 + index;
  return `${String(base).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${index % 10}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function pick<T>(items: T[], index: number) {
  return items[index % items.length];
}

function weightedPick<T>(items: T[], index: number) {
  return items[(index * 7 + Math.floor(index / 3)) % items.length];
}

function isTerminalStatus(status: TicketStatus) {
  return status === TicketStatus.FINISHED || status === TicketStatus.CLOSED;
}

function buildTicketDates(now: Date, status: TicketStatus, appliedSlaDays: number, index: number) {
  const ageDays = Math.max(0, Math.min(appliedSlaDays - 1, weightedPick([0, 1, 2, 3, 4, 6, 8, 10, 12], index)));
  const createdAt = addDays(now, -ageDays);
  const dueDate = addDays(createdAt, appliedSlaDays);

  if (!isTerminalStatus(status)) {
    return { createdAt, dueDate, finishedAt: null, closedAt: null };
  }

  const finishAgeDays = Math.max(0, Math.min(ageDays, weightedPick([0, 1, 2, 3, 5], index)));
  const finishedAt = addDays(now, -finishAgeDays);
  const closeDelayDays = weightedPick([0, 0, 1, 2], index);
  const proposedClosedAt = addDays(finishedAt, closeDelayDays);
  const closedAt = status === TicketStatus.CLOSED ? (proposedClosedAt > now ? now : proposedClosedAt) : null;
  return { createdAt, dueDate, finishedAt, closedAt };
}

function workerWeight(position: number) {
  if (position === 0) return 170;
  if (position === 1) return 130;
  if (position === 2) return 105;
  if (position === 3) return 82;
  if (position < 10) return 52 - position;
  if (position < 25) return 28 - Math.floor(position / 3);
  if (position < 55) return 12 - (position % 4);
  return 3 + (position % 3);
}

function buildWorkerPool(workers: Awaited<ReturnType<typeof seedUsers>>) {
  return workers.flatMap((worker, position) => Array.from({ length: workerWeight(position) }, () => worker));
}

async function clearExistingData() {
  await prisma.ticketAttachment.deleteMany();
  await prisma.ticketComment.deleteMany();
  await prisma.ticketDerivation.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers(passwordHash: string) {
  const fixedUsers = [
    { name: 'Encargado Demo', rut: '11.111.111-1', email: 'encargado@demo.cl', role: UserRole.MANAGER },
    { name: 'Subrogante Demo', rut: '22.222.222-2', email: 'subrogante@demo.cl', role: UserRole.SUBSTITUTE },
    { name: 'Trabajador Uno', rut: '33.333.333-3', email: featuredWorkerEmail, role: UserRole.WORKER },
    { name: 'Trabajador Dos', rut: '44.444.444-4', email: 'trabajador.dos@demo.cl', role: UserRole.WORKER },
  ];

  const generatedUsers = Array.from({ length: 96 }, (_, index) => {
    const number = index + 5;
    const role = number <= 8 ? UserRole.SUBSTITUTE : UserRole.WORKER;
    return {
      name: role === UserRole.WORKER ? `Trabajador Demo ${String(number).padStart(3, '0')}` : `Subrogante Demo ${String(number).padStart(3, '0')}`,
      rut: seededRut(number),
      email: role === UserRole.WORKER ? `trabajador.${String(number).padStart(3, '0')}@demo.cl` : `subrogante.${String(number).padStart(3, '0')}@demo.cl`,
      role,
    };
  });

  const users = [...fixedUsers, ...generatedUsers];

  for (const user of users) {
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: user.email }, { rut: user.rut }] },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { ...user, passwordHash, enabled: true },
      });
    } else {
      await prisma.user.create({ data: { ...user, passwordHash, enabled: true } });
    }
  }

  return prisma.user.findMany({ where: { email: { in: users.map((user) => user.email) } }, orderBy: { email: 'asc' } });
}

async function seedTicketTypes() {
  for (const ticketType of ticketTypeSeeds) {
    await prisma.ticketType.upsert({
      where: { name: ticketType.name },
      update: { description: ticketType.description, slaDays: ticketType.slaDays, active: true },
      create: ticketType,
    });
  }

  await prisma.ticketType.updateMany({
    where: { name: { notIn: ticketTypeSeeds.map((ticketType) => ticketType.name) } },
    data: { active: false },
  });

  return prisma.ticketType.findMany({ where: { name: { in: ticketTypeSeeds.map((ticketType) => ticketType.name) } }, orderBy: { name: 'asc' } });
}

async function seedTickets(users: Awaited<ReturnType<typeof seedUsers>>, ticketTypes: Awaited<ReturnType<typeof seedTicketTypes>>) {
  const manager = users.find((user) => user.email === 'encargado@demo.cl') ?? users[0];
  const workers = users.filter((user) => user.role === UserRole.WORKER);
  const workerPool = buildWorkerPool(workers);
  const statuses = [
    TicketStatus.ENTERED,
    TicketStatus.ENTERED,
    TicketStatus.DERIVED,
    TicketStatus.DERIVED,
    TicketStatus.IN_PROGRESS,
    TicketStatus.IN_PROGRESS,
    TicketStatus.IN_PROGRESS,
    TicketStatus.PENDING_INFORMATION,
    TicketStatus.PENDING_INFORMATION,
    TicketStatus.FINISHED,
    TicketStatus.CLOSED,
  ];
  const priorities = [Priority.LOW, Priority.MEDIUM, Priority.MEDIUM, Priority.HIGH, Priority.HIGH, Priority.URGENT];
  const channels = [InputChannel.EMAIL, InputChannel.EMAIL, InputChannel.IN_PERSON];
  const slaAdjustments = [-4, -2, 0, 0, 1, 3, 5];
  const now = new Date();

  for (let index = 1; index <= totalTickets; index += 1) {
    const ticketType = weightedPick(ticketTypes, index);
    const assignedTo = weightedPick(workerPool, index);
    const status = weightedPick(statuses, index);
    const priority = weightedPick(priorities, index);
    const inputChannel = weightedPick(channels, index);
    const appliedSlaDays = Math.max(1, ticketType.slaDays + weightedPick(slaAdjustments, index));
    const { createdAt, dueDate, finishedAt, closedAt } = buildTicketDates(now, status, appliedSlaDays, index);
    const requesterName = pick(requesterNames, index);
    const requesterEmail = `${requesterName.toLowerCase().replace(/\s+/g, '.')}@${pick(requesterDomains, index)}`;
    const requesterPhone = `+569${String(7_000_0000 + index).slice(-8)}`;
    const code = `DOM-${String(index).padStart(4, '0')}`;
    const title = `${pick(titlePool, index)} ${String(index).padStart(4, '0')}`;
    const description = `${pick(descriptionPool, index)} Prioridad ${priority.toLowerCase()} y estado ${status.toLowerCase()}.`;

    const ticket = await prisma.ticket.upsert({
      where: { code },
      update: {
        title,
        description,
        priority,
        status,
        inputChannel,
        ticketTypeId: ticketType.id,
        assignedToId: assignedTo.id,
        createdById: manager.id,
        closedById: status === TicketStatus.CLOSED ? manager.id : null,
        requesterName,
        requesterEmail,
        requesterPhone,
        appliedSlaDays,
        dueDate,
        finishedAt,
        closedAt,
        createdAt,
        enabled: true,
        deleted: false,
      },
      create: {
        code,
        title,
        description,
        priority,
        status,
        inputChannel,
        ticketTypeId: ticketType.id,
        assignedToId: assignedTo.id,
        createdById: manager.id,
        closedById: status === TicketStatus.CLOSED ? manager.id : null,
        requesterName,
        requesterEmail,
        requesterPhone,
        appliedSlaDays,
        dueDate,
        finishedAt,
        closedAt,
        createdAt,
      },
    });

    const existingHistory = await prisma.ticketHistory.findFirst({
      where: { ticketId: ticket.id, action: TicketHistoryAction.CREATED, details: { path: ['seed'], equals: true } },
    });

    if (!existingHistory) {
      await prisma.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          userId: manager.id,
          action: TicketHistoryAction.CREATED,
          newStatus: status,
          newAssigneeId: assignedTo.id,
          details: { seed: true, code },
          createdAt,
        },
      });
    }
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);
  await clearExistingData();
  const [users, ticketTypes] = await Promise.all([seedUsers(passwordHash), seedTicketTypes()]);
  await seedTickets(users, ticketTypes);

  const [userCount, ticketTypeCount, ticketCount] = await Promise.all([
    prisma.user.count(),
    prisma.ticketType.count({ where: { active: true } }),
    prisma.ticket.count({ where: { deleted: false } }),
  ]);

  console.log(`Seed completed: ${userCount} users, ${ticketTypeCount} active ticket types, ${ticketCount} tickets.`);
  console.log(`Login: encargado@demo.cl / ${password}`);
  console.log(`Generated ${totalTickets} non-overdue tickets with irregular worker workload.`);
}

main().finally(async () => prisma.$disconnect());
