# JaneClone — Especificación Funcional del Sistema

**Versión:** 1.0  
**Fecha:** Mayo 2026  
**Estado:** MVP en producción  
**URL producción:** https://janeclone.vercel.app  

---

## 1. Visión General

JaneClone es una plataforma SaaS multi-tenant de gestión de turnos online para profesionales de la salud y el bienestar (psicólogos, kinesiólogos, nutricionistas, médicos, etc.).

Cada profesional registrado obtiene:
- Un **panel de gestión privado** para administrar su agenda, clientes, servicios y disponibilidad
- Una **página pública de reservas** bajo una URL personalizada (`/book/[slug]`) que puede compartir con sus pacientes

Los pacientes reservan sin necesidad de crear una cuenta. El sistema confirma el turno y notifica a ambas partes por email.

---

## 2. Actores del Sistema

| Actor | Descripción |
|---|---|
| **Profesional (Tenant)** | Usuario registrado. Gestiona su práctica desde el dashboard. |
| **Paciente (Cliente)** | Visitante anónimo que reserva un turno desde la página pública. |
| **Sistema** | Procesa lógica de negocio: validación de slots, pagos, emails automáticos. |

---

## 3. Módulos Funcionales

### 3.1 Registro y Autenticación

**Registro de profesionales**
- El profesional completa: nombre completo, email, contraseña (mínimo 8 caracteres)
- El sistema genera automáticamente un `slug` único basado en el nombre (ej. `florencia-lucchini`)
- La contraseña se almacena con hash `bcrypt` (12 rounds)
- Al registrarse, la cuenta queda activa inmediatamente

**Login**
- Autenticación con email + contraseña vía NextAuth.js (credentials provider)
- Sesión persistida con JWT
- Redirección automática a `/dashboard` tras login exitoso

**Seguridad**
- Todas las rutas `/dashboard/**` y `/api/**` (excepto booking público) requieren sesión activa
- El token de sesión incluye: `id`, `name`, `email`, `slug` del tenant

---

### 3.2 Dashboard del Profesional

URL base: `/dashboard`

#### 3.2.1 Inicio (Home)

Muestra un resumen del día actual:

| Métrica | Descripción |
|---|---|
| Turnos hoy | Cantidad de turnos confirmados para el día actual |
| Clientes totales | Total de clientes registrados en la cuenta |
| Cobrado hoy | Suma de servicios con `paymentStatus = PAID` del día |
| Cobros pendientes | Turnos `CONFIRMED` con `paymentStatus = UNPAID` |

Lista cronológica de los turnos del día con: hora inicio/fin, nombre del cliente, servicio, precio, estado del turno, estado del pago, y acciones rápidas.

#### 3.2.2 Agenda (`/dashboard/appointments`)

Lista completa de todos los turnos agrupados por fecha (más recientes primero, límite 50).

**Por cada turno se muestra:**
- Nombre del cliente
- Servicio y horario
- Precio
- Badge de estado del pago (`UNPAID / PAID / REFUNDED / FAILED`)
- Badge de estado del turno (`PENDING / CONFIRMED / CANCELLED / COMPLETED / NO_SHOW`)
- Menú de acciones (dropdown)

**Acciones disponibles sobre un turno:**
- Confirmar → `status = CONFIRMED`
- Completar → `status = COMPLETED`
- Marcar "No asistió" → `status = NO_SHOW`
- Marcar como pagado → `paymentStatus = PAID` (pago manual en efectivo)
- Cancelar → `status = CANCELLED` (libera el slot)
- Reactivar (solo si estaba cancelado) → `status = PENDING`

#### 3.2.3 Clientes (`/dashboard/clients`)

Lista de todos los pacientes con: nombre, email, teléfono, cantidad de turnos, fecha del último turno.

Los clientes se crean automáticamente al momento de la primera reserva. Si el mismo email reserva nuevamente, se actualiza el perfil existente (upsert por `tenantId + email`).

**Perfil de cliente (`/dashboard/clients/[id]`):**
- Datos de contacto editables
- Historial completo de turnos
- Campo de notas internas (solo visible para el profesional)

#### 3.2.4 Servicios (`/dashboard/services`)

CRUD completo de servicios ofrecidos.

**Campos por servicio:**
| Campo | Tipo | Descripción |
|---|---|---|
| `name` | string | Nombre del servicio |
| `description` | string? | Descripción opcional |
| `duration` | int | Duración en minutos |
| `price` | int | Precio en centavos (ej. 500000 = $5.000 ARS) |
| `color` | string | Color hex para identificación visual |
| `isActive` | boolean | Si aparece en el booking público |

Un servicio desactivado no es visible para los pacientes pero conserva el historial de turnos.

#### 3.2.5 Disponibilidad (`/dashboard/availability`)

El profesional configura su agenda semanal definiendo horarios por día de la semana.

**Por cada día (Lunes a Domingo):**
- Toggle activo/inactivo
- Hora de inicio (ej. `10:00`)
- Hora de fin (ej. `19:00`)

La configuración se guarda con upsert: si ya existe disponibilidad para ese día, se actualiza; si no, se crea.

**Lógica de slots:**
El sistema genera slots de disponibilidad calculando:
1. Toma el rango horario del día (ej. 10:00–19:00)
2. Divide en bloques de la duración del servicio seleccionado
3. Elimina slots ya ocupados por otros turnos no cancelados
4. Elimina slots en el pasado (anteriores al momento actual)

#### 3.2.6 Configuración (`/dashboard/settings`)

El profesional puede editar su perfil público:

| Campo | Descripción |
|---|---|
| Nombre | Nombre que aparece en la página de reservas |
| Bio | Descripción breve de su especialidad |
| Teléfono | Contacto opcional |
| Dirección | Dirección del consultorio |
| Color de acento | Color principal de su página de reservas (personalización de marca) |

El `slug` se genera una sola vez al registrarse y no es modificable desde la UI.

---

### 3.3 Flujo de Reserva (Paciente)

URL base: `/book/[slug]`

El flujo es completamente público — el paciente no necesita registrarse.

#### Paso 1: Selección de servicio — `/book/[slug]`

- Muestra el perfil del profesional (nombre, bio, dirección, avatar con inicial)
- Lista de servicios activos con: nombre, descripción, duración, precio
- Al seleccionar un servicio, avanza al paso 2

#### Paso 2: Selección de fecha y hora — `/book/[slug]/[serviceId]`

- Indicador de progreso (3 pasos: Fecha → Datos → Confirmado)
- Resumen del servicio seleccionado (nombre, duración, precio)
- Calendario semanal con días disponibles (según configuración de disponibilidad)
- Días sin disponibilidad configurada aparecen deshabilitados
- Al seleccionar un día, se cargan los slots horarios disponibles vía API
- Al seleccionar un slot horario, aparece el botón de continuar

**Reglas de disponibilidad:**
- No se muestran días anteriores al día actual
- No se muestran slots anteriores a la hora actual
- No se muestran slots ocupados por turnos existentes no cancelados

#### Paso 3: Formulario de datos — componente `BookingForm`

El paciente completa:
- Nombre completo *(requerido)*
- Email *(requerido)*
- Teléfono *(opcional)*
- Comentarios / consultas *(opcional)*

**Al confirmar, el sistema:**
1. Crea o actualiza el registro del cliente (upsert por `tenantId + email`)
2. Verifica que el slot siga disponible (prevención de race conditions)
3. Crea el turno con:
   - Si el servicio tiene precio > 0 y `STRIPE_ENABLED != false` → estado `PENDING`
   - Si el servicio es gratuito o pagos desactivados → estado `CONFIRMED`

**Flujo de pago (cuando aplica):**
- Se crea una preferencia en MercadoPago con los datos del servicio
- El paciente es redirigido al checkout de MercadoPago
- MercadoPago redirige según el resultado:
  - Éxito → `/book/[slug]/success?appointment_id=[id]`
  - Pago pendiente → `/book/[slug]/success?appointment_id=[id]&pending=1`
  - Cancelación → `/book/[slug]/cancel?appointment_id=[id]`

#### Paso 4a: Confirmación exitosa — `/book/[slug]/success`

- Muestra resumen del turno (profesional, servicio, fecha, hora, precio)
- Indica si el pago fue confirmado o está pendiente
- Email de confirmación enviado al paciente y al profesional

#### Paso 4b: Pago cancelado — `/book/[slug]/cancel`

- Informa que no se realizó ningún cobro
- El turno queda en estado `CANCELLED` (slot liberado)
- Opción de volver a elegir turno

---

### 3.4 Notificaciones por Email

El sistema envía emails automáticos en dos situaciones:

**Email al paciente — Confirmación de turno**
- Asunto: `Turno confirmado: [servicio] con [profesional]`
- Contenido: datos del turno (servicio, fecha, hora, lugar, precio), info del profesional
- Enviado cuando: turno gratuito confirmado, o pago aprobado por webhook de MP

**Email al profesional — Nueva reserva**
- Asunto: `Nueva reserva: [cliente] – [servicio]`
- Contenido: datos del cliente (nombre, email, teléfono), datos del turno (servicio, fecha, hora, notas), link al dashboard
- Enviado en las mismas condiciones que el email al paciente

Los emails se envían de forma asíncrona (fire-and-forget) para no bloquear la respuesta al usuario. Se usa Resend como proveedor.

---

## 4. Modelo de Datos

### Entidades principales

```
Tenant (Profesional)
├── id, name, slug (único), email (único), passwordHash
├── bio, phone, address, timezone, currency
├── logoUrl, accentColor
└── → Services[], Availability[], Appointments[], Clients[]

Service (Servicio)
├── id, tenantId, name, description
├── duration (minutos), price (centavos), color
├── isActive
└── → Appointments[]

Availability (Disponibilidad semanal)
├── id, tenantId
├── dayOfWeek (0=Domingo … 6=Sábado)
├── startTime, endTime (formato "HH:mm")
└── isActive

Client (Paciente)
├── id, tenantId, name, email, phone, notes
└── → Appointments[]

Appointment (Turno)
├── id, tenantId, serviceId, clientId
├── startTime, endTime (DateTime UTC)
├── status: PENDING | CONFIRMED | CANCELLED | COMPLETED | NO_SHOW
├── paymentStatus: UNPAID | PAID | REFUNDED | FAILED
├── notes, stripeCheckoutSession (preference ID de MP)
└── → Payment?

Payment (Registro de pago)
├── id, appointmentId, amount (centavos), currency
├── stripePaymentIntentId (ID de pago en MP)
└── status: UNPAID | PAID | REFUNDED | FAILED
```

### Reglas de integridad
- Un cliente se identifica unívocamente por `(tenantId, email)` — no puede haber dos clientes con el mismo email en la misma cuenta
- La disponibilidad es única por `(tenantId, dayOfWeek)`
- Un turno en estado `CANCELLED` libera el slot para nuevas reservas
- La eliminación de un tenant elimina en cascada todos sus datos (servicios, clientes, turnos, disponibilidad)

---

## 5. API REST

Todas las rutas `/api/**` (excepto `/api/register`, `/api/slots` y `/api/payments/webhook`) requieren sesión autenticada.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/register` | Crear cuenta de profesional |
| POST | `/api/appointments` | Crear turno (público) |
| GET | `/api/appointments` | Listar turnos del profesional autenticado |
| PATCH | `/api/appointments/[id]` | Actualizar estado/pago de un turno |
| GET | `/api/slots` | Obtener slots disponibles para fecha+servicio |
| GET/POST/DELETE | `/api/services` | CRUD de servicios |
| PUT | `/api/availability` | Actualizar disponibilidad semanal |
| GET/POST | `/api/clients` | Listar / actualizar clientes |
| PUT | `/api/settings` | Actualizar perfil del profesional |
| POST | `/api/payments/checkout` | Crear preferencia de pago en MercadoPago |
| POST | `/api/payments/webhook` | Recibir notificaciones de pago de MercadoPago |

---

## 6. Integraciones Externas

### 6.1 MercadoPago

- **Tipo:** Checkout Pro (hosted checkout)
- **Flujo:** Preferencia → Redirect → Webhook → Confirmación
- **Modo test:** Activado con `MP_ACCESS_TOKEN` que empiece con `TEST-`
- **Modo bypass:** Con `STRIPE_ENABLED=false` se omite el pago y el turno se confirma directamente
- **Webhook:** `POST /api/payments/webhook` recibe eventos `payment` con estados `approved`, `rejected`, `cancelled`

### 6.2 Resend (Email)

- **Uso:** Envío de emails transaccionales (confirmación al paciente + notificación al profesional)
- **Templates:** HTML inline sin dependencias externas
- **Modo local:** Con `FROM_EMAIL=...@resend.dev` funciona sin dominio propio

---

## 7. Configuración de Entornos

| Variable | Descripción | Requerida |
|---|---|---|
| `DATABASE_URL` | Connection string PostgreSQL | Sí |
| `NEXTAUTH_SECRET` | Secret para firmar JWTs | Sí |
| `NEXTAUTH_URL` | URL base de la app | Sí |
| `MP_ACCESS_TOKEN` | Token de MercadoPago | Para pagos |
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | Public key de MP (frontend) | Para pagos |
| `STRIPE_ENABLED` | `"false"` para bypass de pagos | Opcional |
| `RESEND_API_KEY` | API key de Resend | Para emails |
| `FROM_EMAIL` | Dirección remitente | Para emails |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app | Sí |

---

## 8. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript |
| Base de datos | PostgreSQL (Neon serverless en producción) |
| ORM | Prisma 7 |
| Autenticación | NextAuth.js 4 (credentials) |
| UI | Tailwind CSS + Radix UI + shadcn/ui |
| Íconos | Lucide React |
| Pagos | MercadoPago Checkout Pro |
| Emails | Resend (HTML inline templates) |
| Deploy | Vercel (Hobby plan) |
| Repositorios | GitHub (`mleonangeli_meli/jane-clone`, `mleonangeli-ia/jane-clone`) |

---

## 9. Flujos de Estado de un Turno

```
[Reserva sin pago]
  → CONFIRMED ──→ COMPLETED
                ↘ CANCELLED
                ↘ NO_SHOW

[Reserva con pago]
  → PENDING ──[pago aprobado]──→ CONFIRMED ──→ COMPLETED
           ↘ [pago rechazado/expirado] ──→ CANCELLED
           ↘ [cancelado por paciente] ──→ CANCELLED

[Acciones manuales del profesional]
  Cualquier estado → CANCELLED (excepto ya cancelados)
  CANCELLED → PENDING (reactivación)
  CONFIRMED → NO_SHOW | COMPLETED
```

---

## 10. Alcance del MVP y Funcionalidad Futura

### En producción actualmente ✓
- Registro y autenticación de profesionales
- Página pública de reservas con selección de servicio, fecha y hora
- Gestión de servicios, disponibilidad, clientes y turnos
- Confirmación de turnos con emails automáticos
- Integración con MercadoPago Checkout Pro
- Dashboard con métricas del día
- Acciones manuales sobre turnos (confirmar, completar, cobrar, cancelar)

### Fuera del alcance del MVP (próximas versiones)
- Recordatorios automáticos por email/WhatsApp (24hs antes del turno)
- Posibilidad de que el paciente cancele o reagende su turno
- Múltiples profesionales bajo una misma cuenta (clínicas)
- Integración con Google Calendar / iCal
- Formularios de anamnesis / intake forms
- Reportes y facturación
- App móvil nativa
- Portal del paciente con historial de turnos
- Video consulta / telemedicina

---

## 11. Restricciones y Consideraciones

- **Multi-tenancy:** La separación de datos entre profesionales se garantiza por `tenantId` en todas las consultas. No existe aislamiento de BD (single DB, shared schema).
- **Concurrencia:** La detección de conflictos de horario en la creación de turnos no usa locks de DB; en escenarios de muy alta concurrencia podría haber doble booking. Para MVP es aceptable.
- **Precios:** Se almacenan en centavos (enteros) para evitar problemas de precisión con punto flotante. La visualización divide por 100.
- **Zona horaria:** Todos los `DateTime` se almacenan en UTC. La conversión a zona horaria del profesional (default: `America/Argentina/Buenos_Aires`) se realiza en el frontend.
- **Slugs:** Son inmutables una vez creados. Cambiar el nombre del profesional no cambia la URL pública.
