# CRM SaaS Enterprise-Grade — Arquitectura, Producto y Finanzas

## 0) Resumen Ejecutivo
Este documento define el **blueprint integral** para construir un CRM SaaS enterprise-grade orientado a agencias de IA y servicios B2B con foco en:

- **Unificación operativa** de Ventas, Marketing, Soporte, Finanzas y Operaciones.
- **Arquitectura de microservicios lógica** sobre Supabase/PostgreSQL y Edge Functions.
- **Automatización financiera total** (facturación recurrente, cobros, P&L, EBITDA).
- **Omnicanalidad** con WhatsApp Business API y timeline 360°.
- **Gobernanza multi-tenant** con RLS estricto y auditoría inmutable.

---

## 1) Visión general y UX core (Design System)

### North Star
Construir el “**cerebro operativo unificado**” de la empresa para acelerar ingresos, reducir fugas de margen y elevar la predictibilidad de caja.

### Principios UX/UI
- Estética **Linear/Stripe**: superficies limpias, mucho espacio negativo, jerarquía tipográfica técnica.
- **Dark mode nativo** y tokenización de colores.
- **Keyboard-first**: `Cmd+K` como comando universal (navegación, acciones rápidas, creación de registros).
- Micro-interacciones: estados de carga discretos, drag-and-drop fluido, feedback instantáneo.

### Arquitectura de frontend recomendada
- **Next.js + TypeScript + Tailwind + shadcn/ui**.
- Diseño por dominios: `/sales`, `/finance`, `/support`, `/ops`.
- Capa de datos con React Query + Supabase client.

---

## 2) Arquitectura de datos (Supabase/PostgreSQL)

### Modelo multi-tenant
Todas las tablas de negocio incluyen:
- `tenant_id uuid not null`
- `created_at`, `updated_at`
- `created_by`, `updated_by`
- Índices compuestos por `tenant_id` + claves de consulta frecuente.

### Esquema núcleo (normalizado)

#### Core
- `profiles` (usuarios internos, roles y pertenencia organizacional)
- `accounts` (empresa cliente)
- `contacts` (personas dentro de una cuenta)
- `leads` (captación inicial)
- `opportunities` (pipeline comercial)

#### Finanzas
- `products` (catálogo)
- `subscriptions` (planes activos)
- `invoices` (facturas emitidas)
- `invoice_items` (líneas)
- `expenses` (costes fijos, variables y payroll)
- `tax_rules` (IVA/retenciones por país/región)

#### Activos
- `documents` (contratos/propuestas con versionado)
- `proposals` (ofertas comerciales)
- `media_assets` (archivos multimedia)

#### Integración/Gobernanza
- `api_keys`
- `webhooks`
- `webhook_deliveries`
- `whatsapp_logs`
- `audit_logs`
- `activities` (timeline 360°)

### SQL base (fragmento de referencia)
```sql
create table accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  industry text,
  status text not null default 'active',
  owner_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  source text not null,
  full_name text,
  email text,
  phone text,
  budget_estimate numeric(14,2),
  score numeric(6,2) not null default 0,
  stage text not null default 'new',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_leads_tenant_stage on leads(tenant_id, stage);
create index idx_leads_tenant_score on leads(tenant_id, score desc);
```

---

## 3) Gestión de leads e ingestión inteligente

### Captura multicanal
- API pública (`POST /v1/leads`)
- Webhooks (Meta forms, Typeform, LinkedIn lead gen)
- Formularios nativos embebibles

### Motor de lead scoring
Scoring configurable por tenant con pesos por:
- Industria objetivo
- Presupuesto estimado
- Comportamiento digital (aperturas, clics, respuestas, no-show)
- Fit técnico (stack, madurez de datos, tamaño de equipo)

**Fórmula sugerida:**
`score = Σ(feature_i * weight_i) + bonus_intent - penalty_risk`

### Conversión atómica
Transacción ACID:
1. `lead` → `contact`
2. `lead` → `account` (si no existe)
3. `lead` → `opportunity`
4. `task` onboarding creada
5. Registro en `audit_logs`

---

## 4) Pipeline Kanban de alto rendimiento

### UX de pipeline
- Drag-and-drop con persistencia optimista.
- Columnas por etapa (MQL, SQL, Discovery, Proposal, Negotiation, Won/Lost).
- WIP limits opcionales por etapa.

### Detección de stale deals
Regla:
- Si `last_activity_at` > N días por etapa, marcar `stale=true`.
- Generar alerta para owner y manager.

### Forecasting
- Ingreso proyectado por mes:
`forecast = Σ(amount * win_probability * close_month_factor)`
- Comparación contra cuota mensual y gap de cierre.

---

## 5) Engine de facturación y automatización financiera

### Suscripciones y facturación
- Facturación recurrente por ciclo (mensual/anual).
- Prorrateo por upgrade/downgrade en mitad de período.
- Notas de crédito automáticas cuando aplique.

### Cobros
- Estados: `draft`, `issued`, `paid`, `overdue`, `void`.
- Recordatorios automáticos por vencimiento (`D-3`, `D+1`, `D+7`).

### SaaS BI financiero
Dashboard con:
- **MRR**
- **ARR**
- **LTV**
- **CAC**
- **Churn de ingresos y de clientes**

---

## 6) Seguridad, RLS y cumplimiento (Governance)

### Modelo de permisos
- **Comercial**: acceso a sus registros propios.
- **Manager**: acceso al equipo.
- **Admin**: acceso global del tenant.

### RLS en Supabase
Políticas por `tenant_id` + ownership/equipo.

```sql
alter table opportunities enable row level security;

create policy opp_select_policy on opportunities
for select using (
  tenant_id = auth.jwt()->>'tenant_id'::uuid
);
```

> Nota: en implementación real, usar cast correcto y funciones helper seguras (`current_tenant_id()`, `has_role()`).

### Auditoría inmutable
`audit_logs` incluye:
- `actor_id`
- `entity_type`, `entity_id`
- `action`
- `old_value jsonb`, `new_value jsonb`
- `ip`, `user_agent`, `created_at`

No se permiten updates/deletes para perfiles no privilegiados.

---

## 7) Motor de personalización no-code

### Custom fields
- Tabla `custom_fields` por entidad (`lead`, `account`, `opportunity`, etc.)
- Valores en `custom_field_values` o `jsonb` por registro.
- Render dinámico de formularios sin migraciones SQL constantes.

### Workflow designer
IF-THEN-ELSE low-code:
- Trigger (evento)
- Condición (filtros)
- Acción (interna/externa)

Ejemplo:
- IF invoice overdue > 7 días
- THEN enviar WhatsApp + crear tarea de cobranza + webhook a ERP

---

## 8) Comunicación omnicanal y WhatsApp (CTI)

### WhatsApp Business API
- Plantillas HSM para:
  - Bienvenida
  - Factura emitida
  - Recordatorio de pago
  - Reunión agendada

### Timeline 360°
Tabla `activities` unificada:
- `channel` (`email`, `whatsapp`, `call`, `note`, `meeting`)
- `direction` (`inbound`/`outbound`)
- `content`, `metadata`, `related_entity`

---

## 9) Inteligencia de datos y ML-ready

### Preparación de datos
- Eventos normalizados + feature store ligera (vistas/materializadas).
- Campos preparados para NLP en tickets/notas.

### Casos iniciales
- Sentiment scoring en soporte.
- Extracción de entidades en notas comerciales.
- Sugerencias de upsell por patrones de compra y uso.

---

## 10) Gamificación y adopción (PLG)

- Leaderboards por actividad, revenue generado y precisión forecast.
- Checklist onboarding dinámico por rol.
- Nudges contextuales para completar datos críticos.

---

## 11) Conexión universal (Make, Zapier, n8n)

### Outgoing webhooks
- Reintentos exponenciales (`1m`, `5m`, `30m`, `2h`, `12h`).
- Dead-letter queue para inspección manual.
- Panel con historial, latencia y tasa de error.

### API de desarrollador
- `api_keys` con scopes granulares (`leads:write`, `invoices:read`, etc.)
- Rotación y expiración de llaves.
- Firma HMAC para webhooks.

---

## 12) Gastos, rentabilidad neta y EBITDA

### Control de gastos
- Clasificación: `fixed`, `variable`, `payroll`, `one_off`.
- Asignación a cliente/proyecto/unidad de negocio.

### P&L visual
`Ingresos - COGS - OPEX = EBITDA operativo`

Vistas por:
- Cliente
- Proyecto
- Unidad de negocio
- Mes/Trimestre

### ROI real
`ROI = (Revenue - Total Cost) / Total Cost`

Incluye costos operativos para evitar falsas métricas de rentabilidad.

---

## 13) Gestión de documentos y activos (The Vault)

- Repositorio jerárquico por cuenta/proyecto.
- Versionado semántico (`v1`, `v1.1`, `v2`).
- Workflow de aprobación interna (draft → review → approved).
- Firma electrónica integrable (DocuSign/Adobe Sign).

---

## 14) Big data reporting

- Vistas materializadas para históricos volumétricos.
- Refresh incremental por ventanas temporales.
- Exportación masiva a `CSV/JSON` por jobs asíncronos.

---

## 15) Infraestructura, resiliencia y escalabilidad

### Stack recomendado
- **Supabase Postgres** (core data + auth)
- **Edge Functions (Deno)** para jobs, ingestión y automatizaciones.
- **Redis/Queue** para tareas de alto throughput.
- **Object storage** para documentos y activos.

### Performance
- Índices B-tree en filtros frecuentes.
- Índices parciales para estados activos.
- Partitioning lógico por fecha para logs/eventos.
- Observabilidad: métricas, trazas y alertas SLO.

### Roadmap de entrega sugerido
1. **MVP (6-8 semanas):** Core CRM + pipeline + facturación básica + RLS.
2. **V2 (8-12 semanas):** WhatsApp + webhooks + dashboard SaaS BI.
3. **V3 (12+ semanas):** Workflow no-code + ML insights + P&L avanzado.

---

## KPIs de éxito (Producto + Finanzas)
- Tiempo de respuesta a lead < 5 min.
- Conversión lead→opportunity +20%.
- DSO (días de cobro) -25%.
- Precisión forecast mensual > 85%.
- Margen EBITDA por cuenta visible y accionable.

