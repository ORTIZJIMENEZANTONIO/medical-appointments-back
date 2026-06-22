# Medical Appointments API

API REST para **agendar citas médicas** entre doctores y pacientes, resolviendo el
problema central de **evitar el empalme (traslape) de citas por doctor** bajo concurrencia.

Construida con **NestJS + TypeORM + SQL Server**, con migraciones versionadas, validación
de entrada, manejo de errores centralizado y logging estructurado.

---

## 📋 Tabla de contenido
- [Stack](#-stack)
- [Requisitos previos](#-requisitos-previos)
- [Puesta en marcha (cualquier máquina)](#-puesta-en-marcha-cualquier-máquina)
- [Variables de entorno](#-variables-de-entorno)
- [Scripts disponibles](#-scripts-disponibles)
- [Endpoints](#-endpoints)
- [Modelo de datos](#-modelo-de-datos)
- [Decisiones de arquitectura](#-decisiones-de-arquitectura)
- [Reglas de negocio](#-reglas-de-negocio)
- [Pruebas](#-pruebas)
- [Notas y solución de problemas](#-notas-y-solución-de-problemas)

---

## 🧱 Stack

| Capa | Tecnología |
|------|------------|
| Runtime | Node.js **22.x** |
| Framework | NestJS **11** |
| ORM | TypeORM **0.3** (migraciones, sin `synchronize`) |
| Base de datos | SQL Server **2022** (vía Docker) |
| Validación | class-validator + class-transformer |
| Documentación | Swagger / OpenAPI (`@nestjs/swagger`) |
| Logging | pino (`nestjs-pino`) |
| Build dev | SWC (compilación rápida + resolución de path aliases) |

---

## ✅ Requisitos previos

Solo necesitas tener instalado:

- **Docker** y **Docker Compose** (para la base de datos, no requiere instalar SQL Server)
- **Node.js 22.x** ([nvm](https://github.com/nvm-sh/nvm): `nvm install 22 && nvm use 22`)
- **Yarn** (`npm i -g yarn`)

> No necesitas instalar SQL Server en tu máquina: corre dentro de un contenedor.

---

## 🚀 Puesta en marcha (cualquier máquina)

### 1. Clonar e instalar dependencias
```bash
git clone <url-del-repo>
cd medical-appointments-back
yarn install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```
Los valores por defecto ya coinciden con `docker-compose.yml`, así que **funciona sin editar nada** en local.

### 3. Levantar la base de datos (SQL Server en Docker)
```bash
docker compose up -d
```
Espera ~30–60 s la primera vez a que el contenedor termine de arrancar.

### 4. Crear la base de datos
El contenedor arranca solo con las bases de sistema; hay que crear la de la app (idempotente):
```bash
docker exec -it medical-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Promass@2026' -C \
  -Q "IF DB_ID('medical_appointments') IS NULL CREATE DATABASE medical_appointments"
```
> En **Windows (PowerShell/CMD)** usa comillas dobles alrededor del password y la query.

### 5. Ejecutar migraciones (crea tablas + siembra el catálogo de estados)
```bash
yarn migration:run
```

### 6. Arrancar la API
```bash
yarn start:dev
```

La API queda en **http://localhost:3000** y la documentación Swagger en
**http://localhost:3000/api/docs**.

---

## 🔑 Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `PORT` | Puerto de la API | `3000` |
| `NODE_ENV` | `development` \| `production` | `development` |
| `DB_HOST` | Host de SQL Server | `localhost` |
| `DB_PORT` | Puerto de SQL Server | `1433` |
| `DB_USERNAME` | Usuario | `sa` |
| `DB_PASSWORD` | Contraseña (debe coincidir con `docker-compose.yml`) | `Promass@2026` |
| `DB_NAME` | Nombre de la base | `medical_appointments` |
| `LOG_LEVEL` | Nivel de log de pino | `info` |

> ⚠️ Para **producción**: cambia `DB_PASSWORD`, usa `encrypt: true` con certificado válido,
> y nunca subas el `.env` (está en `.gitignore`).

---

## 📜 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `yarn start:dev` | Arranca en modo watch (SWC) |
| `yarn start:prod` | Arranca el build de producción (`node dist/main`) |
| `yarn build` | Compila a `dist/` |
| `yarn migration:run` | Aplica las migraciones pendientes |
| `yarn migration:revert` | Revierte la última migración |
| `yarn migration:generate` | Genera una migración nueva desde las entidades *(solo en desarrollo)* |
| `yarn test` | Pruebas unitarias (sin DB) |
| `yarn test:int` | Pruebas de integración (DB real) |
| `yarn test:e2e` | Pruebas end-to-end (HTTP + DB) |
| `yarn lint` | Linter (ESLint + Prettier) |

---

## 🌐 Endpoints

Base URL: `http://localhost:3000`

### Doctores
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/doctors` | Registrar doctor |
| `GET` | `/doctors` | Listar doctores |

### Pacientes
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/patients` | Registrar paciente |
| `GET` | `/patients` | Listar pacientes |

### Citas
| Método | Ruta | Descripción | Códigos |
|--------|------|-------------|---------|
| `POST` | `/appointments` | Agendar cita | `201` · `400` (validación: fecha pasada/inválida) · `404` (doctor/paciente) · `409` (empalme) |
| `GET` | `/appointments` | Listar citas (filtros: `doctorId`, `from`, `to`, `status`) | `200` |
| `PATCH` | `/appointments/:id/cancel` | Cancelar cita | `200` · `404` · `409` |

> La documentación interactiva completa (request/response, ejemplos, esquemas) vive en
> **`/api/docs`**.

---

## 🗃️ Modelo de datos

```
doctors                 patients                appointment_status (catálogo)
─────────               ─────────               ──────────────────
id (PK, INT IDENTITY)   id (PK, INT IDENTITY)   id (PK, TINYINT)  → 1=ACTIVE, 2=CANCELLED
name                    name                    name
lastname1               lastname1
lastname2 (opcional)    lastname2 (opcional)
email (UNIQUE)          email (UNIQUE)
phone (10 dígitos)      phone (10 dígitos)
specialty
created_at              created_at

appointments
────────────
id (PK, INT IDENTITY)
doctor_id   (FK → doctors)
patient_id  (FK → patients)
status_id   (FK → appointment_status, default 1=ACTIVE)
appointment_date (datetime2)   ← inicio; la cita dura 30 min fijos (el fin se deriva)
reason
created_at
cancelled_at (nullable)

Índices:
  IDX_overlap_check       (doctor_id, status_id, appointment_date)  → acelera el chequeo de empalme
  UQ_doctor_active_slot   UNIQUE (doctor_id, appointment_date) WHERE status_id = 1
                          → defensa a nivel DB contra doble-booking exacto (filtered index de SQL Server)
```

---

### Decisiones de dominio (México)
- **Teléfono**: 10 dígitos numéricos (estándar nacional MX desde 2022), almacenado **como string** —
  un teléfono no es un número (no se hace aritmética con él y podría perder ceros a la izquierda).
- **Apellido materno (`lastname2`) opcional**: en México no es obligatorio tener segundo apellido.

### Zona horaria (UTC)
- **Toda fecha se maneja y almacena en UTC.** La API recibe `appointmentDate` en **ISO 8601 con zona**
  (ej. `2026-07-01T10:00:00Z`); el cliente envía la hora con su offset y el backend trabaja el instante
  en UTC.
- En SQL Server la columna es `datetime2` (sin zona): se guarda el instante ya normalizado. El chequeo de
  solapamiento y el de "fecha futura" comparan con el epoch (`Date.getTime()` / `Date.now()`), que es
  **siempre UTC** → sin ambigüedad por horario de verano.
- **Por qué importa**: en agendas médicas el manejo inconsistente de zonas es causa clásica de
  "empalmes fantasma". Centralizar en UTC y dejar la presentación local al frontend elimina esa clase de bug.


---

## 🧪 Pruebas

Estrategia en **pirámide** (muchas unit, algunas de integración, pocas e2e). La matriz
completa de casos está en [`docs/test-matrix.md`](docs/test-matrix.md).

| Capa | Comando | Necesita DB | Qué valida |
|------|---------|-------------|------------|
| Unitarias | `yarn test` | ❌ (repos mockeados) | Lógica de services y del validador de fecha |
| Integración | `yarn test:int` | ✅ | Overlap real (SQL), back-to-back, multi-doctor, cancelación libera horario, **concurrencia** |
| End-to-end | `yarn test:e2e` | ✅ | Stack HTTP completo: ruteo, `ValidationPipe`, filtro de errores, persistencia |

**Base de datos de prueba** (solo para `test:int` / `test:e2e`): se usa una BD separada
`${DB_NAME}_test` con auto-schema (no toca datos de desarrollo). Créala una vez:

```bash
docker exec -it medical-sqlserver /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P 'Promass@2026' -C \
  -Q "IF DB_ID('medical_appointments_test') IS NULL CREATE DATABASE medical_appointments_test"
```

Casos clave cubiertos (núcleo de la prueba):
- **Empalme** del mismo doctor → `409` (CIT-08).
- **Back-to-back** (cita exactamente +30 min) → permitido `201` (CIT-10).
- Cita en horario de una cita **cancelada** → permitido `201` (CIT-12 / CAN-05).
- **Concurrencia**: dos creaciones simultáneas del mismo slot → exactamente **1×`201`** y **1×`409`** (CON-01).

---

## 🛠️ Notas y solución de problemas

- **Apple Silicon (M1/M2/M3)**: la imagen de SQL Server es solo `amd64`; el `docker-compose.yml`
  fuerza `platform: linux/amd64` para correr bajo emulación. En máquinas amd64 (Linux/Windows
  Intel) corre de forma nativa.
- **`Login failed for user 'sa'`**: la `DB_PASSWORD` del `.env` no coincide con la del contenedor,
  o la base `medical_appointments` aún no existe (paso 4).
- **`self-signed certificate`**: asegúrate de tener `trustServerCertificate: true` en
  `src/database/data-source.ts` (ya configurado para local).
- **El contenedor "no arranca" / cuelga**: SQL Server tarda en aceptar conexiones la primera vez;
  espera ~1 min y reintenta.
- **Resetear todo desde cero**:
  ```bash
  docker compose down -v   # borra el contenedor y su volumen de datos
  docker compose up -d
  # repetir pasos 4 y 5
  ```
