# Municipal DOM Ticket Tracing

Sistema para trazabilidad de solicitudes DOM/Obras con backend NestJS, Prisma, PostgreSQL, y frontend React + Vite + TypeScript.

## Stack

- Backend: NestJS, Prisma 7, PostgreSQL, JWT, bcrypt, DTOs con `class-validator`.
- Frontend: React, Vite, TypeScript, Ant Design.
- Dominio: solicitudes, tipos SLA, derivaciones usuario a usuario, historial inmutable, observaciones, adjuntos, dashboard y reportes.

## Backend

```bash
cd backend
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Para cargar datos demo destructivos:

```bash
set ALLOW_DESTRUCTIVE_SEED=true
npm run seed
```

Credenciales seed:

- `encargado@demo.cl` / `11223344`

## Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Variables de entorno backend

```env
NODE_ENV="development"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/municipal_tickets?schema=public"
JWT_SECRET="replace-with-a-strong-secret-of-at-least-32-characters"
JWT_EXPIRES_IN="8h"
CORS_ORIGIN="http://localhost:5173"
PORT=3000
UPLOAD_DIR="./uploads"
ALLOW_DESTRUCTIVE_SEED=false
```

- `DATABASE_URL`: conexion PostgreSQL usada por Prisma.
- `NODE_ENV`: `development`, `test` o `production`.
- `JWT_SECRET`: secreto JWT. En produccion es obligatorio y debe tener al menos 32 caracteres.
- `JWT_EXPIRES_IN`: duracion del access token, por ejemplo `15m`, `8h` o `7d`.
- `CORS_ORIGIN`: origenes permitidos separados por coma. En produccion es obligatorio.
- `ALLOW_DESTRUCTIVE_SEED`: debe ser `true` para ejecutar el seed que borra y regenera datos demo.

## Produccion controlada

Antes de desplegar:

- Definir `NODE_ENV=production`.
- Definir `JWT_SECRET` fuerte y unico para el ambiente.
- Definir `CORS_ORIGIN` con el dominio real del frontend.
- No ejecutar `npm run seed` en produccion. El seed demo queda bloqueado con `NODE_ENV=production`.
- Configurar backups y restauracion de PostgreSQL.
- Servir backend y frontend por HTTPS.
- Configurar logs y monitoreo del proceso.
- Revisar `PRODUCTION_CHECKLIST.md` antes de abrir acceso a usuarios reales.

Comandos de produccion backend:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
npm run build
npm run start:prod
```

## Healthcheck

El backend expone:

```http
GET /api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2026-04-28T00:00:00.000Z",
  "database": "ok"
}
```

## Notas de arquitectura

- `TicketDerivation` registra derivaciones usuario a usuario mediante `fromUserId`, `toUserId` y `performedById`.
- `TicketHistory` no tiene borrado logico ni endpoints de eliminacion.
- `TicketType.slaDays` se copia a `Ticket.appliedSlaDays` al crear la solicitud.
- `dueDate` no se recalcula por derivaciones ni reasignaciones.
- `WORKER` solo ve y opera solicitudes asignadas.
- `MANAGER` y `SUBSTITUTE` tienen permisos administrativos equivalentes.
