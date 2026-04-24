# Coding Standards

## 1. Purpose

This document defines the naming standard for the project and a safe migration strategy from Spanish code nomenclature to English.

Scope:

- New code must be written in English.
- Existing code will be migrated gradually when it is modified for real business work.
- UI text visible to end users stays in Spanish.
- Database and Prisma naming stay in Spanish for now.
- API endpoints stay unchanged for now.

## 2. Official Languages By Layer

### Code language

- Official code language: English
- Applies to:
  - variables
  - functions
  - methods
  - classes
  - interfaces
  - TypeScript types
  - DTO property aliases only when new contracts are introduced
  - helper names
  - internal comments
  - test names when new tests are added

### UI language

- Official UI language: Spanish
- Applies to:
  - labels
  - buttons
  - table headers
  - validation messages shown to users
  - alerts and operational texts
  - business wording seen by DOM / Obras users

### Database language

- Official database language for the current stage: Spanish
- Applies to:
  - Prisma models
  - Prisma enums
  - Prisma fields
  - mapped table names
  - column names
- Reason:
  - avoid risky migrations
  - preserve compatibility with existing data and migrations

### API language

- Official API language for the current stage: Spanish
- Applies to:
  - controller route paths
  - request and response contracts already in use
- Reason:
  - avoid breaking frontend and existing clients

## 3. General Naming Rules

### Variables

- Use `camelCase`
- Prefer descriptive names over abbreviations
- Use domain names in English

Examples:

- `solicitud` -> `request`
- `usuario` -> `user`
- `responsable` -> `assignedUser`
- `historial` -> `history`
- `fechaVencimiento` -> `dueDate`
- `tipoSolicitud` -> `requestType`

### Functions and methods

- Use `camelCase`
- Start with an action verb when possible

Examples:

- `crearSolicitud` -> `createRequest`
- `listarUsuarios` -> `listUsers`
- `obtenerResumenGeneral` -> `getGeneralSummary`
- `validarDestinoAsignacion` -> `validateAssignmentTarget`
- `calcularFechaVencimientoPorSla` -> `calculateDueDateFromSla`

### Classes

- Use `PascalCase`
- Use English nouns

Examples:

- `SolicitudesService` -> `RequestsService`
- `UsuariosController` -> `UsersController`
- `FiltroSolicitudesDto` -> `RequestFiltersDto`
- `LoginRateLimitGuard` stays in English already

### Interfaces and types

- Use `PascalCase`
- Use English business names

Examples:

- `Solicitud` -> `Request`
- `SolicitudDetalle` -> `RequestDetail`
- `UsuarioSesion` -> `SessionUser`
- `CredencialesLogin` -> `LoginCredentials`

### Files

- Prefer English file names
- Keep the existing case and separator style of the layer where they live

Examples:

- `solicitudes.service.ts` -> `requests.service.ts`
- `FormularioSolicitud.tsx` -> `RequestForm.tsx`
- `PaginaSolicitudes.tsx` -> `RequestsPage.tsx`
- `useConsulta.ts` -> `useQuery.ts` or `useAsyncQuery.ts`

## 4. Conversion Dictionary

This is the recommended glossary for gradual migration.

| Spanish | English |
|---|---|
| solicitud | request |
| solicitudes | requests |
| usuario | user |
| usuarios | users |
| responsable | assignedUser |
| asignadoA | assignedUser |
| tipoSolicitud | requestType |
| tiposSolicitud | requestTypes |
| historial | history |
| adjunto | attachment |
| adjuntos | attachments |
| fechaVencimiento | dueDate |
| fechaCierre | closedAt |
| creadoEn | createdAt |
| actualizadoEn | updatedAt |
| creadoPor | createdBy |
| area | area |
| autenticacion | authentication |
| reporte | report |
| reportes | reports |
| prioridad | priority |
| estado | status |
| observacion | note |
| comentario | comment |
| canalIngreso | intakeChannel |
| correlativo | sequenceNumber |
| numeroSolicitud | externalReference |
| cerrar | close |
| finalizar | finalize |
| derivar | reassign |
| asignar | assign |
| vencida | overdue |
| por vencer | dueSoon |
| cargar/listar | list/load depending on context |

Notes:

- `area` may remain `area` in code because it is already a valid English word.
- `correlativo` should map to `sequenceNumber` or `requestNumber` depending on context.
- Since business decided that `correlativo` is the main visible identifier, prefer:
  - UI label in Spanish: `Numero de solicitud`
  - internal English name for future code: `sequenceNumber`

## 4.1 Official Naming Glossary

The following glossary is the official reference for all new code.

If a new term is not listed here, it must be documented before being adopted in new code.

| Current Spanish term | Recommended English name | Recommended usage | Example |
|---|---|---|---|
| solicitud | request | Main domain entity, variables, services, types | `request`, `createRequest`, `RequestDetail` |
| usuario | user | Generic user entity, auth/session, API/service code | `user`, `activeUser`, `userService` |
| trabajador | worker | Role-specific naming when the code refers to operational workers | `workerDashboard`, `workerSummary` |
| coordinador | coordinator | Role-specific naming for coordinator flows | `coordinatorPanel`, `coordinatorActions` |
| suplente | substitute | Role-specific naming for substitute/coordinator backup | `substituteAccess`, `substituteRole` |
| responsable | assignedUser | Current owner of a request | `assignedUser`, `assignedUserId` |
| tipoSolicitud | requestType | Catalog of predefined request types | `requestType`, `requestTypeId` |
| prioridad | priority | Priority fields, filters and labels in code | `priority`, `priorityFilter` |
| estado | status | Request state or operational state | `status`, `currentStatus` |
| fechaVencimiento | dueDate | Deadline field or computed due information | `dueDate`, `calculateDueDate()` |
| fechaCierre | closedAt | Request closure timestamp | `closedAt`, `closedAtLabel` |
| fechaIngreso | createdAt or submittedAt | Use `createdAt` for system record creation and `submittedAt` for intake/submission context | `createdAt`, `submittedAt` |
| adjunto | attachment | Files linked to a request | `attachment`, `attachmentList` |
| historial | history | Audit trail, change log, operational trace | `history`, `requestHistory` |
| observacion | note or comment | Use `note` for operational annotation and `comment` for generic textual remarks | `addNote`, `commentText` |
| canalIngreso | intakeChannel | Origin channel for request intake | `intakeChannel`, `intakeChannelOptions` |
| correlativo | sequenceNumber | Main visible request number in code | `sequenceNumber`, `nextSequenceNumber` |
| vencida | overdue | Requests past due date | `overdue`, `isOverdue` |
| porVencer | dueSoon | Requests close to due date | `dueSoon`, `dueSoonCount` |
| dashboard | dashboard | Keep as is | `dashboard`, `workerDashboard` |
| reporte | report | Reports, analytics and report pages/services | `report`, `reportSummary` |

### Glossary Rules

- Do not mix Spanish and English in new files.
- Do not rename Prisma models, Prisma fields, tables, columns, enums, or endpoints for now.
- Visible UI text remains in Spanish.
- All new code must use this glossary.
- If a new business term is not in the glossary, document it before using it in code.

## 5. Current State Analysis

### Most frequent Spanish terms in code

Approximate high-frequency terms found in the repo:

- `usuario`
- `solicitud`
- `prioridad`
- `area`
- `fechaVencimiento`
- `tipoSolicitud`
- `adjunto`
- `autenticacion`
- `historial`
- `canalIngreso`
- `responsable`
- `asignar`
- `cerrar`
- `derivar`
- `finalizar`

### Backend areas with highest Spanish density

- `backend/src/solicitudes`
- `backend/src/usuarios`
- `backend/src/reportes`
- `backend/src/adjuntos`
- `backend/src/autenticacion`
- `backend/src/tipos-solicitud`
- `backend/src/historial-solicitudes`

### Frontend areas with highest Spanish density

- `frontend/src/paginas`
- `frontend/src/componentes/solicitudes`
- `frontend/src/componentes/reportes`
- `frontend/src/ganchos`
- `frontend/src/servicios`
- `frontend/src/tipos`
- `frontend/src/utilidades`

### Examples of current Spanish routes that must stay for now

- `/solicitudes`
- `/usuarios`
- `/tipos-solicitud`
- `/reportes`
- backend API controllers such as:
  - `@Controller('solicitudes')`
  - `@Controller('usuarios')`
  - `@Controller('reportes')`

## 6. What Must Not Change In This Stage

- Prisma schema names
- Prisma enums
- database tables or columns
- backend endpoint paths
- frontend route paths
- visible UI text for users
- existing payload shapes unless required by feature work

## 7. Safe Migration Strategy

### Rule for all new code

Every new file, variable, function, helper, type, class, and test created from now on must use English naming.

Exceptions:

- UI text shown to users remains in Spanish
- Prisma names remain in Spanish
- endpoints remain in Spanish

### Rule for existing code

Existing code should only be renamed when one of these is true:

- the file is already being modified for business work
- the rename is local and low risk
- tests can be updated in the same change
- imports and references are easy to validate

Avoid rename-only pull requests over large areas of the codebase.

## 8. Recommended Migration Order

### Phase 1: New code only

- All newly created code uses English naming
- No file renames required
- Lowest risk

### Phase 2: Internal helpers and utilities

Good first candidates:

- `frontend/src/utilidades`
- `frontend/src/ganchos`
- `backend/src/comun`
- non-public helper functions inside services

Reason:

- lower blast radius
- fewer public contracts

### Phase 3: Frontend types and service internals

Good candidates:

- `frontend/src/tipos`
- `frontend/src/servicios/*`
- local variables inside pages and components

Reason:

- can improve consistency without changing user-facing UI

### Phase 4: Backend service internals

Good candidates:

- internal method names
- private helpers
- local variables in services

Avoid in this phase:

- controller route paths
- DTO contract names if they are heavily referenced outside the module

### Phase 5: File and class renames

Candidates after the system is stable:

- `FormularioSolicitud.tsx` -> `RequestForm.tsx`
- `PaginaSolicitudes.tsx` -> `RequestsPage.tsx`
- `solicitudes.service.ts` -> `requests.service.ts`

This phase requires:

- import updates
- test validation
- route/module import review

### Phase 6: Public contracts and Prisma

Only consider later if there is a strong reason.

Includes:

- endpoint route renames
- DTO payload renames
- Prisma model renames
- database column or table renames

This phase is high risk and out of scope for the current standard.

## 9. Best First Candidates For Gradual Migration

These are the safest places to start when touching code again:

### Frontend

- `frontend/src/utilidades/crud.ts`
- `frontend/src/utilidades/fechas.ts`
- `frontend/src/utilidades/reportes.ts`
- `frontend/src/utilidades/solicitudesOperativas.ts`
- `frontend/src/ganchos/useConsulta.ts`
- `frontend/src/ganchos/useMutacion.ts`
- `frontend/src/ganchos/useValorDebounceado.ts`

### Backend

- `backend/src/comun/*.util.ts`
- private methods inside `backend/src/solicitudes/solicitudes.service.ts`
- private methods inside `backend/src/reportes/reportes.service.ts`
- test names and local variables in `backend/test/*`

## 10. Naming Examples In Practice

### Example A: backend local refactor inside an existing file

Current:

```ts
const solicitud = await this.asegurarSolicitudActivaExiste(id);
const usuario = await this.asegurarUsuarioActivoExiste(actorId);
const historial = [];
```

Target style:

```ts
const request = await this.ensureActiveRequestExists(id);
const user = await this.ensureActiveUserExists(actorId);
const history = [];
```

### Example B: frontend local variable rename

Current:

```ts
const consulta = useConsulta(() => solicitudesService.listar(), []);
const usuarios = useConsulta(() => usuariosService.listar(), []);
```

Target style:

```ts
const requestQuery = useQuery(() => requestsService.list(), []);
const usersQuery = useQuery(() => usersService.list(), []);
```

### Example C: keep Spanish UI while internal code is English

```ts
<PageSection
  title="Solicitudes"
  description="Operacion diaria de DOM / Obras."
/>
```

Internal code may be English even if visible text stays Spanish.

## 11. Review Checklist For Future Changes

When modifying a file, check:

- Are new variables in English?
- Are new helper methods in English?
- Are new types/interfaces in English?
- Did we avoid changing Prisma and endpoints?
- Did we keep user-facing UI text in Spanish?
- Did we avoid mixing new Spanish names into new code?

## 12. Final Recommendation

Use the following project rule from now on:

- New code: English
- Existing code: migrate gradually when touched
- UI text: Spanish
- Prisma/database: Spanish for now
- Endpoints/routes: unchanged for now

This gives a safe path to standardize the codebase without risky migrations or breaking current functionality.
