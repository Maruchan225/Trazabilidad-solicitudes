# Backend De Trazabilidad Municipal

Base backend para un sistema interno municipal de trazabilidad de solicitudes con NestJS, TypeScript, PostgreSQL y Prisma.

## Stack

- Node.js
- TypeScript
- NestJS
- Express
- PostgreSQL
- Prisma

## Modulos

- `areas`
- `usuarios`
- `tipos-solicitud`
- `solicitudes`
- `historial-solicitudes`
- `prisma`

## Estructura De Carpetas

```text
backend/
|-- prisma/
|   |-- migrations/
|   |   |-- 20260408174000_base_trazabilidad_municipal/
|   |   |   `-- migration.sql
|   |   `-- migration_lock.toml
|   `-- schema.prisma
|-- src/
|   |-- app.controller.spec.ts
|   |-- app.controller.ts
|   |-- app.module.ts
|   |-- app.service.ts
|   |-- main.ts
|   |-- common/
|   |   `-- prisma-error.util.ts
|   |-- prisma/
|   |   |-- prisma.module.ts
|   |   `-- prisma.service.ts
|   |-- areas/
|   |   |-- dto/
|   |   |   |-- create-area.dto.ts
|   |   |   `-- update-area.dto.ts
|   |   |-- areas.controller.ts
|   |   |-- areas.module.ts
|   |   `-- areas.service.ts
|   |-- usuarios/
|   |   |-- dto/
|   |   |   |-- create-usuario.dto.ts
|   |   |   `-- update-usuario.dto.ts
|   |   |-- usuarios.controller.ts
|   |   |-- usuarios.module.ts
|   |   `-- usuarios.service.ts
|   |-- tipos-solicitud/
|   |   |-- dto/
|   |   |   |-- create-tipo-solicitud.dto.ts
|   |   |   `-- update-tipo-solicitud.dto.ts
|   |   |-- tipos-solicitud.controller.ts
|   |   |-- tipos-solicitud.module.ts
|   |   `-- tipos-solicitud.service.ts
|   |-- historial-solicitudes/
|   |   |-- historial-solicitudes.controller.ts
|   |   |-- historial-solicitudes.module.ts
|   |   `-- historial-solicitudes.service.ts
|   `-- solicitudes/
|       |-- dto/
|       |   |-- asignar-solicitud.dto.ts
|       |   |-- cambiar-estado-solicitud.dto.ts
|       |   |-- cerrar-solicitud.dto.ts
|       |   |-- create-solicitud.dto.ts
|       |   `-- derivar-solicitud.dto.ts
|       |-- solicitudes.controller.ts
|       |-- solicitudes.module.ts
|       `-- solicitudes.service.ts
|-- test/
|   |-- app.e2e-spec.ts
|   |-- jest-e2e.json
|   `-- setup-e2e.ts
|-- .env.example
|-- package.json
`-- tsconfig.json
```

## Variables De Entorno

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/trazabilidad_municipal?schema=public"
```

## Instalacion

```bash
npm install
cp .env.example .env
```

En PowerShell:

```powershell
Copy-Item .env.example .env
```

## Prisma

Generar cliente:

```bash
npm run prisma:generate
```

Crear y aplicar migraciones en desarrollo:

```bash
npm run prisma:migrate -- --name base_trazabilidad_municipal
```

Aplicar migraciones existentes:

```bash
npm run prisma:deploy
```

## Ejecutar

```bash
npm run start:dev
```

Base URL:

```text
http://localhost:3000/api
```

## Endpoints Principales

- `POST /api/areas`
- `GET /api/areas`
- `PATCH /api/areas/:id`
- `DELETE /api/areas/:id`
- `POST /api/usuarios`
- `GET /api/usuarios`
- `PATCH /api/usuarios/:id`
- `DELETE /api/usuarios/:id`
- `POST /api/tipos-solicitud`
- `GET /api/tipos-solicitud`
- `PATCH /api/tipos-solicitud/:id`
- `DELETE /api/tipos-solicitud/:id`
- `POST /api/solicitudes`
- `GET /api/solicitudes`
- `GET /api/solicitudes/:id`
- `PATCH /api/solicitudes/:id/asignar`
- `PATCH /api/solicitudes/:id/derivar`
- `PATCH /api/solicitudes/:id/estado`
- `PATCH /api/solicitudes/:id/cerrar`
- `GET /api/historial-solicitudes`
- `GET /api/historial-solicitudes/solicitud/:solicitudId`

## Ejemplos De Solicitudes

Crear area:

```bash
curl -X POST http://localhost:3000/api/areas -H "Content-Type: application/json" -d "{\"nombre\":\"Obras Municipales\",\"descripcion\":\"Gestion de obras y mantenciones\"}"
```

Crear usuario:

```bash
curl -X POST http://localhost:3000/api/usuarios -H "Content-Type: application/json" -d "{\"nombres\":\"Ana\",\"apellidos\":\"Perez\",\"email\":\"ana.perez@municipio.local\",\"rol\":\"TRABAJADOR\",\"areaId\":1}"
```

Crear tipo de solicitud:

```bash
curl -X POST http://localhost:3000/api/tipos-solicitud -H "Content-Type: application/json" -d "{\"nombre\":\"Bacheo\",\"descripcion\":\"Reparacion de pavimento\",\"diasSla\":10}"
```

Crear solicitud:

```bash
curl -X POST http://localhost:3000/api/solicitudes -H "Content-Type: application/json" -d "{\"titulo\":\"Reparacion de vereda\",\"descripcion\":\"Se solicita reparacion de vereda en calle principal\",\"prioridad\":\"ALTA\",\"fechaVencimiento\":\"2026-04-20T18:00:00.000Z\",\"creadoPorId\":1,\"areaActualId\":1,\"tipoSolicitudId\":1}"
```

Asignar solicitud:

```bash
curl -X PATCH http://localhost:3000/api/solicitudes/1/asignar -H "Content-Type: application/json" -d "{\"asignadoAId\":1,\"actorUsuarioId\":1,\"comentario\":\"Asignada para revision tecnica\"}"
```

Derivar solicitud:

```bash
curl -X PATCH http://localhost:3000/api/solicitudes/1/derivar -H "Content-Type: application/json" -d "{\"areaDestinoId\":2,\"actorUsuarioId\":1,\"comentario\":\"Se deriva a transito por competencia\"}"
```

Cambiar estado:

```bash
curl -X PATCH http://localhost:3000/api/solicitudes/1/estado -H "Content-Type: application/json" -d "{\"estado\":\"EN_PROCESO\",\"actorUsuarioId\":1,\"comentario\":\"Trabajo iniciado\"}"
```

Cerrar solicitud:

```bash
curl -X PATCH http://localhost:3000/api/solicitudes/1/cerrar -H "Content-Type: application/json" -d "{\"actorUsuarioId\":1,\"comentario\":\"Solicitud completada y cerrada\"}"
```

## Decisiones Tomadas

- La base de datos usa nombres en espanol para enums, tablas y columnas.
- Los modulos principales tambien quedaron nombrados en espanol para mantener consistencia de dominio.
- `HistorialSolicitud` registra automaticamente eventos de creacion, asignacion, desasignacion, derivacion, cambio de estado y cierre.
- La logica de solicitudes usa transacciones Prisma para mantener consistencia entre la solicitud y su historial.
