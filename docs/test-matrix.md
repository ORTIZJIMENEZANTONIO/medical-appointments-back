# Matriz de pruebas — Medical Appointments API

Trazable a requisitos funcionales y reglas de negocio. Cubre casos positivos,
negativos, de borde y de seguridad, mapeados a niveles de prueba.

## Convenciones
- **Tipo**: ✅ Positivo · ❌ Negativo · ⚠️ Borde · 🔒 Seguridad
- **Nivel**: `U` unitario (service con repo mockeado) · `I` integración (service + DB) · `E` e2e (HTTP/supertest)
- **Prio**: Alta / Media / Baja

---

## 1. Doctores (`/doctors`)

| ID | Caso | Entrada | Esperado | Tipo | Nivel | Prio |
|---|---|---|---|---|---|---|
| DOC-01 | Crear doctor válido | name, lastname1, email, phone(10) | `201` + entidad con `id` | ✅ | E/I | Alta |
| DOC-02 | Email duplicado | email ya registrado | `409` + `EMAIL_ALREADY_REGISTERED` | ❌ | I | Alta |
| DOC-03 | Email inválido | `email:"abc"` | `400` + `EMAIL_INVALID` | ❌ | E | Alta |
| DOC-04 | Teléfono ≠ 10 dígitos | `phone:"12345"` | `400` + `PHONE_FORMAT` | ❌ | E | Alta |
| DOC-05 | Teléfono con letras | `phone:"55abc12345"` | `400` + `PHONE_FORMAT` | ❌ | E | Media |
| DOC-06 | Falta campo requerido | sin `name` | `400` | ❌ | E | Alta |
| DOC-07 | Sin apellido materno | sin `lastname2` | `201` (opcional) | ⚠️ | E | Media |
| DOC-08 | Campo > maxLength | `name` 60 chars | `400` + `NAME_MAX` | ⚠️ | E | Media |
| DOC-09 | Campo extra no permitido | `{...,"rol":"admin"}` | `400` (forbidNonWhitelisted) | 🔒 | E | Alta |
| DOC-10 | Listar doctores | — | `200` + array | ✅ | E | Media |
| DOC-11 | Obtener por id existente | `/doctors/1` | `200` | ✅ | E | Media |
| DOC-12 | Obtener id inexistente | `/doctors/9999` | `404` + `DOCTOR_NOT_FOUND` | ❌ | E | Alta |
| DOC-13 | Id no numérico | `/doctors/abc` | `400` (ParseIntPipe) | ❌ | E | Media |

> **Pacientes (`/patients`)**: matriz espejo **PAC-01 … PAC-13** (idéntica, sin `specialty`).

---

## 2. Agendar cita (`POST /appointments`) — núcleo

| ID | Caso | Precondición / Entrada | Esperado | Tipo | Nivel | Prio |
|---|---|---|---|---|---|---|
| CIT-01 | Cita válida | doctor+paciente existen, fecha futura | `201` + `statusId=1` | ✅ | E/I | Alta |
| CIT-02 | Doctor inexistente | `doctorId:9999` | `404` + `DOCTOR_NOT_FOUND` | ❌ | I | Alta |
| CIT-03 | Paciente inexistente | `patientId:9999` | `404` + `PATIENT_NOT_FOUND` | ❌ | I | Alta |
| CIT-04 | Fecha pasada | `appointmentDate` ayer | `400` (IsFutureDate) | ❌ | E | Alta |
| CIT-05 | Antelación < 60 min | dentro de 30 min | `400` | ⚠️ | E | Media |
| CIT-06 | Más de 6 meses | +7 meses | `400` | ⚠️ | E | Media |
| CIT-07 | Fecha mal formada | `"2026-13-99"` | `400` + `DATE_INVALID` | ❌ | E | Media |
| CIT-08 | **Empalme exacto, mismo doctor** | misma fecha/hora, status ACTIVE | `409` + `APPOINTMENT_OVERLAP` | ❌ | I | **Alta** |
| CIT-09 | **Empalme parcial (<30 min)** | +15 min del existente | `409` | ❌ | I | **Alta** |
| CIT-10 | **Back-to-back (exacto +30 min)** | +30 min exactos | `201` (NO empalme) | ⚠️ | I | **Alta** |
| CIT-11 | Mismo horario, doctor distinto | otro `doctorId` | `201` | ⚠️ | I | Alta |
| CIT-12 | **Mismo horario que cita CANCELADA** | la previa está `CANCELLED` | `201` (canceladas no bloquean) | ⚠️ | I | **Alta** |
| CIT-13 | `reason` omitido | sin `reason` | `201` (opcional) | ⚠️ | E | Baja |
| CIT-14 | `reason` > 255 | 300 chars | `400` + `REASON_MAX` | ⚠️ | E | Baja |
| CIT-15 | `doctorId` ≤ 0 | `doctorId:0`/`-1` | `400` + `ID_POSITIVE` | ❌ | E | Media |
| CIT-16 | Campos faltantes | sin `patientId` | `400` | ❌ | E | Alta |

---

## 3. Cancelar cita (`PATCH /appointments/:id/cancel`)

| ID | Caso | Entrada | Esperado | Tipo | Nivel | Prio |
|---|---|---|---|---|---|---|
| CAN-01 | Cancelar cita activa | id de cita ACTIVE | `200` + `statusId=2` + `cancelledAt` | ✅ | I | Alta |
| CAN-02 | Cancelar inexistente | id 9999 | `404` + `APPOINTMENT_NOT_FOUND` | ❌ | I | Alta |
| CAN-03 | Cancelar ya cancelada | id ya CANCELLED | `409` + `APPOINTMENT_ALREADY_CANCELLED` | ❌ | I | Alta |
| CAN-04 | Id no numérico | `/abc/cancel` | `400` | ❌ | E | Baja |
| CAN-05 | **Cancelar libera horario** | cancelar → re-agendar mismo slot | `200` luego `201` | ✅ | I | **Alta** |

---

## 4. Consultar citas (`GET /appointments`)

| ID | Caso | Entrada | Esperado | Tipo | Nivel | Prio |
|---|---|---|---|---|---|---|
| LIS-01 | Listar todas | — | `200` + array ordenado por fecha | ✅ | E | Media |
| LIS-02 | Filtrar por doctor | `?doctorId=1` | `200` solo de ese doctor | ✅ | I | Alta |
| LIS-03 | Filtrar por rango | `?startDate&endDate` | `200` dentro del rango | ✅ | I | Alta |
| LIS-04 | Filtrar por status | `?statusId=2` | `200` solo canceladas | ✅ | I | Media |
| LIS-05 | Filtros combinados | doctor + rango | `200` intersección | ⚠️ | I | Media |
| LIS-06 | `startDate` inválido | `?startDate=abc` | `400` + `DATE_RANGE_ISO` | ❌ | E | Media |
| LIS-07 | `statusId` fuera de rango | `?statusId=3` | `400` + `STATUS_INVALID` | ❌ | E | Media |
| LIS-08 | `doctorId` no numérico | `?doctorId=abc` | `400` | ❌ | E | Baja |
| GET-01 | Obtener cita por id | `/appointments/1` | `200` con doctor/paciente/status | ✅ | E | Media |
| GET-02 | Cita inexistente | `/appointments/9999` | `404` | ❌ | E | Media |

---

## 5. Concurrencia (valida el lock anti-empalme) 🎯

| ID | Caso | Escenario | Esperado | Nivel | Prio |
|---|---|---|---|---|---|
| CON-01 | **Doble booking simultáneo** | 2 `POST` en paralelo, mismo doctor/hora | exactamente **1×`201`** y **1×`409`** | I | **Alta** |
| CON-02 | Doctores distintos en paralelo | 2 `POST` simultáneos, doctores distintos | **2×`201`** (no se bloquean) | I | Alta |
| CON-03 | N peticiones al mismo slot | 5 `POST` en paralelo, mismo slot | **1×`201`**, 4×`409` | I | Media |

> Sin CON-01 no hay evidencia de que el anti-empalme funcione bajo carga.

---

## 6. Seguridad / OWASP 🔒

| ID | Caso | Entrada | Esperado | Prio |
|---|---|---|---|---|
| SEC-01 | Mass-assignment | body con `id`, `statusId`, `createdAt` | ignorados/`400` (whitelist) | Alta |
| SEC-02 | 500 no filtra stack | provocar error interno | cuerpo = `INTERNAL` genérico, sin stack | Alta |
| SEC-03 | Anti-enumeración email | email duplicado | mensaje **no** devuelve el email | Media |
| SEC-04 | Inyección SQL en filtro | `?doctorId=1;DROP TABLE` | `400` (validación) — queries parametrizadas | Alta |
| SEC-05 | Not found sin fuga | id inexistente | mensaje genérico, sin detalle interno | Media |

---

## 7. Trazabilidad requisito → casos

| Requisito funcional | Casos que lo cubren |
|---|---|
| Registrar doctores | DOC-01..09 |
| Registrar pacientes | PAC-01..09 |
| Agendar cita | CIT-01 |
| Duración fija 30 min | CIT-09, CIT-10 |
| No traslape por doctor | CIT-08, CIT-09, CON-01, CON-03 |
| Solo futuras | CIT-04, CIT-05, CIT-06, CIT-07 |
| Estado activa/cancelada | CIT-01, CAN-01 |
| Cancelar cita | CAN-01, CAN-03 |
| Canceladas no bloquean | CIT-12, CAN-05 |
| Consultar con filtros | LIS-02, LIS-03, LIS-04 |
| RN: no traslapes | CIT-08/09, CON-01/03 |
| RN: canceladas fuera de disponibilidad | CIT-12, CAN-05 |

---

## 8. Cobertura mínima recomendada (si el tiempo es limitado)

Imprescindibles para demostrar el dominio:
- **CIT-08** (empalme → 409), **CIT-10** (back-to-back permitido), **CIT-12** (cancelada libera),
  **CAN-05** (cancelar libera horario), **CON-01** (concurrencia).
- Validación representativa: **CIT-04** (futura), **DOC-04** (phone), **DOC-09 / SEC-01** (whitelist).
