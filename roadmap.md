# Roadmap de Implementación: Sistema de Soporte Antigravity

Este documento detalla los pasos seguidos y los hitos pendientes para completar el Sistema de Gestión de Tickets.

## 🏁 Fase 1: MVP & Interface (Completada)
- [x] Configuración inicial de **Vite + React + Tailwind**.
- [x] Creación de sistema de **Roles** (Empleado, Técnico, Admin).
- [x] Desarrollo de la **UI Estilo Microsoft Teams** (Adaptive Cards look-alike).
- [x] Implementación de **Mock Services** para desarrollo rápido.
- [x] Gestión local de tickets (LocalStorage) para pruebas offline.

## 📊 Fase 2: Persistencia & IA (Completada)
- [x] Integración con **Supabase** (PostgreSQL).
- [x] Creación del esquema de base de datos (`tickets`, `comments`).
- [x] Configuración de **RLS** (Row Level Security) para protección de datos.
- [x] Integración con **Google Gemini** para análisis de tickets.
- [x] Implementación de **Servicio de Clasificación** automático.
- [x] Desarrollo del **Stats Dashboard** con Recharts.
- [x] Resiliencia de datos: Sincronización transparente entre Supabase y LocalStorage.
- [x] **Asistente IA (Gemini Pro)**: Diagnóstico inteligente y soporte técnico para software.
- [x] **Aprendizaje de Historial**: Uso de soluciones pasadas para nuevas consultas.
- [x] **Wiki Integrada**: Autogestión mediante consulta automática de FAQs.

## 🛡️ Fase 3: Roles & Seguridad Avanzada (Completada)
- [-] ~~Integración con GitHub~~ (Cancelado: se prefiere gestión interna de tickets críticos).
- [x] **Gestión de Roles**: Interfaz para promover usuarios a técnicos desde el panel de Admin.
- [x] **Rol de Técnico Jefe (Lead)**: Implementación de jerarquía técnica para delegación de tareas.
- [x] **Asignación de Tickets**: Capacidad de delegar tickets a técnicos específicos (Admin/Jefe).
- [x] **Clasificación Dinámica**: Estadísticas automáticas basadas en categorías reales de la DB.
- [x] **Auditoría de Cambios**: Registro de quién cambió el estado de un ticket y cuándo.
- [x] **Seguridad de Datos**: Implementación de perfiles en base de datos y auditoría delegada.

## 🔔 Fase 4: Experiencia de Usuario & Pulido
- [x] **Notificaciones Persistentes**: Sistema de alertas guardado en DB (Supabase) y badges de lectura.
- [x] **Sincronización Realtime**: Evolucionar polling a Supabase Realtime para alertar nuevos comentarios y estados (zero-latency).
- [x] **Población de Datos**: Inyección de datos realistas (8+ tickets, múltiples usuarios) para testing de flujos técnicos.
- [x] **Búsqueda Avanzada**: Filtros por fecha, usuario y texto completo. (UI & Client-side filtering)
- [x] **Adjuntos**: Integración en creación de tickets y chat de soporte (Supabase Storage + Previsualización).
- [x] **Modo Offline Mejorado**: Sincronización en segundo plano al recuperar conexión.

## 🚀 Fase 5: Producción & Feedback (En Proceso)
- [x] Configuración de variables de entorno para Producción (Vercel).
- [x] Corrección de errores de compilación y tipos para entornos productivos.
- [x] Despliegue funcional en Vercel.
- [x] Optimización de assets y bundle size (Code-splitting).
- [x] Auditoría de accesibilidad (WCAG AA).
- [x] **Dashboard de Usuario**: Panel con KPIs y estadísticas personalizadas para empleados.
- [x] **Kanban para Empleados**: Tablero visual filtrado por tickets propios con restricciones de rol.
- [x] **Sincronización en Vivo**: Actualización instantánea de estados de tickets en el Panel y Kanban.
- [-] ~~**Asistente IA**~~ (Postergado para v2.0): Desactivado en el MVP para simplificación del flujo inicial.

## 🏢 Fase 6: Escalado Profesional & Workflow (Completada)
- [x] **Aislamiento por Departamentos**: Vistas filtradas por defecto para TI y Servicios Generales.
- [x] **Rol de Supervisor**: Panel de control global con métricas comparativas inter-departamentales.
- [x] **Monitoreo de SLA**: Indicadores visuales de tickets fuera de tiempo (>24h sin respuesta/resolución).
- [x] **Auditoría Extendida**: Trazabilidad completa de cada cambio en prioridad, asignación y clasificación.
- [x] **Optimización para 100 Usuarios**: Mejoras en búsqueda, filtrado y rendimiento de listas.

## 🔜 Próximas Versiones (v2.0)
- [ ] **Estabilización de Asistente IA**: Depuración de errores en la integración con Gemini y mejora de manejo de errores.
- [ ] **IA Predictiva**: Sugerencia automática de técnicos basada en la carga de trabajo y especialidad.
- [ ] **Multilenguaje**: Soporte completo para inglés y otros idiomas.
- [x] **Cola de Espera (Ticket Queue)**: Sistema para que el usuario sepa en todo momento cuántos tickets tiene delante en la cola de atención.
- [x] **Fecha de Finalización Orientativa**: Implementación de una fecha estimada de cierre basada en la prioridad del ticket.
- [x] **Resumen del Problema (Título)**: Campo obligatorio al crear tickets para mejorar la identificación rápida.
- [x] **Gestión Dinámica de Prioridad**: Interfaz para Jefes Técnicos/Admin con codificación de colores visual.


---
*Este roadmap es un documento vivo y se actualizará a medida que avancemos en los objetivos.*
