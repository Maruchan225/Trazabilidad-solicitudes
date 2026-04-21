# Trazabilidad De Solicitudes

Sistema interno municipal para registrar, asignar, derivar y cerrar solicitudes con historial, adjuntos y reportes.

## Stack

- `backend/`: NestJS + Prisma + PostgreSQL
- `frontend/`: React + Vite + Ant Design

## Levantar rapido

Backend:

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run prisma:deploy
npm run prisma:seed
npm run start:dev
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

## Variables de entorno

Backend:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `FRONTEND_URL`

Frontend:

- `VITE_API_URL`

## Validaciones utiles

```powershell
cd backend
npm test
```

```powershell
cd frontend
npm test
npm run build
```

## Notas operativas

- Los adjuntos se almacenan localmente en `backend/uploads/adjuntos`.
- El workflow de CI valida backend y frontend en cada `push` a `main` y en `pull_request`.
