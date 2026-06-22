# Medical Appointments API

API REST para agendar citas médicas entre doctores y pacientes, evitando el empalme
(traslape) de citas por doctor.

## Stack

- Node.js 22 · NestJS 11
- TypeORM (migraciones) · MySQL 8
- Validación: class-validator
- Documentación: Swagger (`/api/docs`)
- Logging: pino

## Requisitos previos

- Docker y Docker Compose
- Node.js 22.x
- Yarn

## Instalación y ejecución

1. Instalar dependencias:

   ```bash
   yarn install
   ```

2. Configurar variables de entorno (los valores por defecto coinciden con `docker-compose.yml`):

   ```bash
   cp .env.example .env
   ```

3. Levantar MySQL (el contenedor crea la base `medical_appointments` automáticamente):

   ```bash
   docker compose up -d
   ```

   Esperar ~10-20 s la primera vez a que MySQL acepte conexiones.

4. Crear la base de pruebas (solo necesaria para `yarn test:int` / `test:e2e`):

   ```bash
   docker exec medical-mysql mysql -uroot -pPromass@2026 \
     -e "CREATE DATABASE IF NOT EXISTS medical_appointments_test"
   ```

5. Ejecutar migraciones (crea tablas y siembra el catálogo de estados):

   ```bash
   yarn migration:run
   ```

6. Arrancar la API:

   ```bash
   yarn start:dev
   ```

La API queda en `http://localhost:3000` y la documentación Swagger en
`http://localhost:3000/api/docs`.

## Variables de entorno

| Variable      | Descripción                                  | Default                |
| ------------- | -------------------------------------------- | ---------------------- |
| `PORT`        | Puerto de la API                             | `3000`                 |
| `NODE_ENV`    | `development` \| `production`                | `development`          |
| `DB_HOST`     | Host de MySQL                                | `localhost`            |
| `DB_PORT`     | Puerto de MySQL                              | `3306`                 |
| `DB_USERNAME` | Usuario                                      | `root`                 |
| `DB_PASSWORD` | Contraseña (coincide con `docker-compose.yml`) | `Promass@2026`       |
| `DB_NAME`     | Nombre de la base                            | `medical_appointments` |
| `LOG_LEVEL`   | Nivel de log de pino                         | `info`                 |

## Scripts

| Comando                  | Descripción                          |
| ------------------------ | ------------------------------------ |
| `yarn start:dev`         | Arranca en modo watch                |
| `yarn start:prod`        | Arranca el build de producción       |
| `yarn build`             | Compila a `dist/`                    |
| `yarn migration:run`     | Aplica las migraciones pendientes    |
| `yarn migration:revert`  | Revierte la última migración         |
| `yarn migration:generate`| Genera una migración desde entidades |
| `yarn test`              | Pruebas unitarias (sin DB)           |
| `yarn test:int`          | Pruebas de integración (DB real)     |
| `yarn test:e2e`          | Pruebas end-to-end (HTTP + DB)       |
| `yarn lint`              | Linter (ESLint + Prettier)           |

## Endpoints

Base URL: `http://localhost:3000`

Doctores:

- `POST /doctors` — registrar doctor
- `GET  /doctors` — listar doctores

Pacientes:

- `POST /patients` — registrar paciente
- `GET  /patients` — listar pacientes

Citas:

- `POST  /appointments` — agendar cita (`201` · `400` validación · `404` doctor/paciente · `409` empalme)
- `GET   /appointments` — listar con filtros: `doctorId`, `startDate`, `endDate`, `statusId`
- `GET   /appointments/:id` — detalle
- `PATCH /appointments/:id/cancel` — cancelar (`200` · `404` · `409`)

El detalle interactivo (request/response, ejemplos) está en `/api/docs`.

## Decisiones de diseño

- **Doctores y pacientes en tablas separadas**: son entidades de dominio distintas; las FK
  separadas garantizan la integridad sin validar roles en código.
- **Estado de la cita en catálogo** (`appointment_status`) en vez de un enum suelto.
- **Cita de 30 min fija**: solo se guarda el inicio; el fin se deriva.
- **No traslape por doctor**: dentro de una transacción se toma un lock pesimista sobre la
  fila del doctor y se valida el solapamiento, de modo que el "verificar + insertar" es
  atómico bajo concurrencia. Las citas canceladas no se consideran (solo estado activo).
- **Fechas en UTC** (ISO 8601 con zona); las comparaciones usan el epoch para evitar bugs
  de zona horaria.
- **Validación con DTOs + `ValidationPipe`** (whitelist); los errores se traducen a códigos
  HTTP consistentes mediante un filtro global.

## Pruebas

Estrategia en pirámide. La matriz de casos está en [`docs/test-matrix.md`](docs/test-matrix.md).

| Capa        | Comando         | DB  | Qué valida                                                   |
| ----------- | --------------- | --- | ------------------------------------------------------------ |
| Unitarias   | `yarn test`     | No  | Lógica de services y del validador de fecha                  |
| Integración | `yarn test:int` | Sí  | Overlap, back-to-back, cancelación libera horario, concurrencia |
| End-to-end  | `yarn test:e2e` | Sí  | Stack HTTP completo (ruteo, validación, filtro de errores)   |

Las pruebas con DB usan una base separada `medical_appointments_test` con auto-schema
(paso 4 de la instalación), por lo que no tocan los datos de desarrollo.
