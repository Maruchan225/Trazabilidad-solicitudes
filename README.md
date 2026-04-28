# Municipal DOM Ticket Tracing

Sistema inicial para trazabilidad de solicitudes DOM/Obras con backend NestJS, Prisma, PostgreSQL, y frontend React + Vite + TypeScript.

# Stack

- Backend: NestJS, Prisma 7, PostgreSQL, JWT, bcrypt, DTOs con `class-validator`.
- Frontend: React, Vite, TypeScript, Ant Design, TailwindCSS.
- Dominio: solicitudes, tipos SLA, derivaciones usuario a usuario, historial inmutable, observaciones, adjuntos, dashboard y reportes.

# Backend

```bash
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run start:dev
```

Credenciales seed:

- `manager@demo.cl` / `Demo1234!`
- `substitute@demo.cl` / `Demo1234!`
- `worker.one@demo.cl` / `Demo1234!`
- `worker.two@demo.cl` / `Demo1234!`

# Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

# PostgreSQL

Configura `DATABASE_URL` en `backend/.env`. Ejemplo:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/municipal_tickets?schema=public"
```

# Notas de arquitectura

- `TicketDerivation` registra derivaciones usuario a usuario mediante `fromUserId`, `toUserId` y `performedById`.
- `TicketHistory` no tiene borrado lógico ni endpoints de eliminación.
- `TicketType.slaDays` se copia a `Ticket.appliedSlaDays` al crear la solicitud.
- `dueDate` no se recalcula por derivaciones ni reasignaciones.
- `WORKER` solo ve y opera solicitudes asignadas.
- `MANAGER` y `SUBSTITUTE` tienen permisos administrativos equivalentes.
