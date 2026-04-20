
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


- `HistorialSolicitud` registra automaticamente eventos de creacion, asignacion, desasignacion, derivacion, cambio de estado y cierre.
- La logica de solicitudes usa transacciones Prisma para mantener consistencia entre la solicitud y su historial.
