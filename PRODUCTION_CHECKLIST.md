# Production Checklist

Checklist para desplegar el sistema de trazabilidad DOM en produccion controlada.

## Variables requeridas

- `NODE_ENV=production`
- `DATABASE_URL`: URL PostgreSQL valida.
- `JWT_SECRET`: secreto unico del ambiente, minimo 32 caracteres.
- `JWT_EXPIRES_IN`: duracion del token, por ejemplo `8h`.
- `CORS_ORIGIN`: dominio real del frontend. No usar `*`.
- `PORT`: puerto del backend.
- `UPLOAD_DIR`: ruta persistente para adjuntos locales.
- `ALLOW_DESTRUCTIVE_SEED=false`

## Pasos de despliegue backend

1. Instalar dependencias con `npm install`.
2. Generar cliente Prisma con `npm run prisma:generate`.
3. Aplicar migraciones con `npm run prisma:migrate:deploy`.
4. Compilar con `npm run build`.
5. Iniciar con `npm run start:prod`.
6. Verificar `GET /api/health`.

## Pasos de despliegue frontend

1. Instalar dependencias con `npm install`.
2. Compilar con `npm run build`.
3. Servir `dist/` mediante HTTPS.
4. Confirmar que el dominio del frontend coincide con `CORS_ORIGIN`.

## Seguridad

- No usar usuarios demo en produccion.
- No ejecutar `npm run seed` en produccion.
- Mantener `ALLOW_DESTRUCTIVE_SEED=false` en servidores reales.
- Usar HTTPS para frontend y backend.
- Guardar `.env` fuera de Git.
- Rotar `JWT_SECRET` si fue compartido o expuesto.

## Base de datos

- Programar backups automaticos de PostgreSQL.
- Probar restauracion en un ambiente separado antes de abrir produccion.
- Mantener migraciones versionadas y aplicar solo con `prisma migrate deploy`.
- No borrar registros de `TicketHistory`.
- No ejecutar deletes manuales sobre tickets, historiales, comentarios o adjuntos.

## Prueba manual por roles

- Encargado puede crear solicitudes.
- Encargado puede derivar, finalizar, cerrar y reabrir segun corresponda.
- Suplente puede operar funciones administrativas permitidas.
- Trabajador solo ve solicitudes asignadas.
- Trabajador no accede a usuarios, tipos de solicitud ni reportes.
- Historial se mantiene despues de crear, editar, derivar, finalizar, cerrar y comentar.
- Adjuntos y comentarios se ocultan con borrado logico cuando corresponde.

## Observabilidad

- Revisar logs del backend ante errores 4xx y 5xx.
- Configurar rotacion de logs.
- Monitorear CPU, RAM, disco y conectividad de PostgreSQL.
- Alertar cuando `/api/health` falle.
