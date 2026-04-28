import 'dotenv/config';
import { InputChannel, PrismaClient, Priority, TicketHistoryAction, TicketStatus, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const password = 'Demo1234!';

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
];

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

async function seedUsers(passwordHash: string) {
  const fixedUsers = [
    { name: 'Manager Demo', rut: '11.111.111-1', email: 'manager@demo.cl', role: UserRole.MANAGER },
    { name: 'Substitute Demo', rut: '22.222.222-2', email: 'substitute@demo.cl', role: UserRole.SUBSTITUTE },
    { name: 'Worker One', rut: '33.333.333-3', email: 'worker.one@demo.cl', role: UserRole.WORKER },
    { name: 'Worker Two', rut: '44.444.444-4', email: 'worker.two@demo.cl', role: UserRole.WORKER },
  ];

  const generatedUsers = Array.from({ length: 96 }, (_, index) => {
    const number = index + 5;
    const role = number <= 8 ? UserRole.SUBSTITUTE : UserRole.WORKER;
    return {
      name: role === UserRole.WORKER ? `Worker Demo ${String(number).padStart(3, '0')}` : `Substitute Demo ${String(number).padStart(3, '0')}`,
      rut: seededRut(number),
      email: role === UserRole.WORKER ? `worker.${String(number).padStart(3, '0')}@demo.cl` : `substitute.${String(number).padStart(3, '0')}@demo.cl`,
      role,
    };
  });

  const users = [...fixedUsers, ...generatedUsers];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name, rut: user.rut, role: user.role, enabled: true },
      create: { ...user, passwordHash, enabled: true },
    });
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
  const manager = users.find((user) => user.email === 'manager@demo.cl') ?? users[0];
  const workers = users.filter((user) => user.role === UserRole.WORKER);
  const statuses = [
    TicketStatus.ENTERED,
    TicketStatus.DERIVED,
    TicketStatus.IN_PROGRESS,
    TicketStatus.PENDING_INFORMATION,
    TicketStatus.FINISHED,
    TicketStatus.CLOSED,
  ];
  const priorities = [Priority.LOW, Priority.MEDIUM, Priority.HIGH, Priority.URGENT];
  const channels = [InputChannel.EMAIL, InputChannel.IN_PERSON];
  const now = new Date();
  const seedCodes = Array.from({ length: 100 }, (_, index) => `DOM-${String(index + 1).padStart(4, '0')}`);

  await prisma.ticket.updateMany({
    where: {
      OR: [{ code: null }, { code: { notIn: seedCodes } }],
    },
    data: { deleted: true, enabled: false },
  });

  for (let index = 1; index <= 100; index += 1) {
    const ticketType = pick(ticketTypes, index);
    const assignedTo = pick(workers, index);
    const status = pick(statuses, index);
    const priority = pick(priorities, index);
    const inputChannel = pick(channels, index);
    const createdAt = addDays(now, -index);
    const dueDate = addDays(createdAt, ticketType.slaDays);
    const finishedAt = status === TicketStatus.FINISHED || status === TicketStatus.CLOSED ? addDays(createdAt, Math.max(1, ticketType.slaDays - 1)) : null;
    const closedAt = status === TicketStatus.CLOSED ? addDays(createdAt, ticketType.slaDays) : null;
    const code = `DOM-${String(index).padStart(4, '0')}`;

    const ticket = await prisma.ticket.upsert({
      where: { code },
      update: {
        title: `${pick(titlePool, index)} ${String(index).padStart(3, '0')}`,
        description: pick(descriptionPool, index),
        priority,
        status,
        inputChannel,
        ticketTypeId: ticketType.id,
        assignedToId: assignedTo.id,
        createdById: manager.id,
        closedById: status === TicketStatus.CLOSED ? manager.id : null,
        appliedSlaDays: ticketType.slaDays,
        dueDate,
        finishedAt,
        closedAt,
        enabled: true,
        deleted: false,
      },
      create: {
        code,
        title: `${pick(titlePool, index)} ${String(index).padStart(3, '0')}`,
        description: pick(descriptionPool, index),
        priority,
        status,
        inputChannel,
        ticketTypeId: ticketType.id,
        assignedToId: assignedTo.id,
        createdById: manager.id,
        closedById: status === TicketStatus.CLOSED ? manager.id : null,
        appliedSlaDays: ticketType.slaDays,
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
  const [users, ticketTypes] = await Promise.all([seedUsers(passwordHash), seedTicketTypes()]);
  await seedTickets(users, ticketTypes);

  const [userCount, ticketTypeCount, ticketCount] = await Promise.all([
    prisma.user.count(),
    prisma.ticketType.count({ where: { active: true } }),
    prisma.ticket.count({ where: { deleted: false } }),
  ]);

  console.log(`Seed completed: ${userCount} users, ${ticketTypeCount} active ticket types, ${ticketCount} tickets.`);
  console.log(`Login: manager@demo.cl / ${password}`);
}

main().finally(async () => prisma.$disconnect());
