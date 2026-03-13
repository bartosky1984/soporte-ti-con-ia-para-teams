# Antigravity: Sistema de Gestión de Tickets Pro para Microsoft Teams

![Antigravity Banner](https://img.shields.io/badge/Status-Phase_2_Complete-blueviolet?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-React_|_Supabase_|_Gemini-00B7C3?style=for-the-badge)

Evolución del bot Antigravity hacia un sistema de tickets profesional integrado en el ecosistema de **Microsoft Teams**. Este proyecto utiliza IA generativa para el triaje y una infraestructura robusta para la persistencia.

## 🚀 Fases del Proyecto

- [x] **Fase 1: MVP**: Despliegue en Vercel, lógica local y generación de tickets temporales.
- [x] **Fase 2: Persistencia**: Integración total con **Supabase** (PostgreSQL) y evolución de la IA (Gemini) para gestionar datos reales.
- [ ] **Fase 3: Integración GitHub**: Sincronización automática de tickets críticos con repositorios de desarrollo.

## 🛠️ Tecnologías Principales

- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Bundler**: Vite 6
- **Backend/DB**: Supabase (PostgreSQL) con RLS habilitado
- **IA**: Google Generative AI (Gemini Pro & Flash)
- **Visualización**: Recharts para el Dashboard de salud IT

## 📱 Funcionalidades Clave

1.  **Gestión de Tickets**: Creación, seguimiento y resolución de incidencias con persistencia en la nube.
2.  **Dashboard de Salud IT**: Visualización en tiempo real de métricas (SLA, volumen por departamento).
3.  **Detección de Brechas de Formación**: Algoritmo que identifica si un problema es técnico o por falta de capacitación del usuario.
4.  **Asistente IA**: Chatbot inteligente que asiste en el triaje y autodiagnóstico.
5.  **Wiki Técnica**: Base de conocimiento integrada para resolución rápida.

## ⚙️ Configuración

### Variables de Entorno (.env)
```env
GEMINI_API_KEY=tu_clave_de_gemini
DB_ENABLED=true
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_public_anon_key
```

### Inicialización de Base de Datos
Ejecuta los siguientes scripts SQL en el editor de Supabase:
- `migraciones/initial_schema.sql` (disponible a través del MCP de Supabase).

## 👨‍💻 Desarrollo e Instalación

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build
```

---
**Desarrollador:** Jorge Luis Iglesias Céspedes
**Versión:** 1.0.0
**Misión:** Simplificar el soporte IT mediante IA y automatización.
