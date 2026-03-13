# 🚀 Guía de Despliegue en Vercel

Esta guía detalla los pasos para desplegar el **Sistema de Soporte TI con IA** en Vercel, asegurando que todas las integraciones (Supabase y Gemini) funcionen correctamente en producción.

---

## 📋 Requisitos Previos

1.  **Cuenta en Vercel**: [vercel.com](https://vercel.com).
2.  **Proyecto en GitHub**: Ya has subido el código a `https://github.com/bartosky1984/soporte-ti-con-ia-para-teams`.
3.  **Supabase**: Un proyecto activo con las tablas `tickets`, `comments` y `ticket_audits`.
4.  **Google AI**: Una API Key de Gemini válida.

---

## 🛠️ Pasos para el Despliegue

### 1. Importar el Proyecto
1. Ve a tu [Dashboard de Vercel](https://vercel.com/dashboard).
2. Haz clic en **"Add New..."** -> **"Project"**.
3. Selecciona tu repositorio: `soporte-ti-con-ia-para-teams`.

### 2. Configuración del Build
Vercel debería detectar automáticamente que es un proyecto de **Vite/React**.
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### 3. Variables de Entorno (CRÍTICO) 🔑
Añade las siguientes variables en la sección **"Environment Variables"** antes de dar a "Deploy".

| Variable | Valor | Descripción |
| :--- | :--- | :--- |
| `DB_ENABLED` | `true` | Activa la persistencia en Supabase. |
| `GEMINI_API_KEY` | `TU_API_KEY` | Tu llave de Google AI Studio. |
| `SUPABASE_URL` | `TU_URL` | URL de tu proyecto Supabase. |
| `SUPABASE_KEY` | `TU_ANON_KEY` | La llave pública (anon) de Supabase. |

> [!IMPORTANT]
> No uses el prefijo `VITE_` a menos que decidas cambiar el archivo `vite.config.ts`. Tal como está configurado el proyecto ahora, el sistema busca estas llaves exactas.

---

## 🔒 Variables de Entorno para copiar/pegar

Si quieres configurarlas rápido, usa estos nombres exactos en el panel de Vercel:

```env
GEMINI_API_KEY=AIza... (tu llave real)
DB_ENABLED=true
SUPABASE_URL=https://ppbrdcqbmtgqrwvzakov.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Verificación Post-Despliegue

Una vez que la URL esté lista (ej. `soporte-ti.vercel.app`):
1. **Login**: Verifica que puedes entrar con cualquier rol.
2. **Base de Datos**: Crea un ticket y verifica en el Panel de Admin de Supabase que se ha guardado.
3. **IA**: Haz una pregunta técnica en el chat para confirmar que Gemini responde.
4. **HTTPS**: Vercel gestiona el SSL automáticamente, asegúrate de que no haya errores de "Mixed Content".

---

## 🔄 Actualizaciones Futuras
Cada vez que hagas un `git push` a la rama `main`, Vercel redesplegará la aplicación automáticamente con los nuevos cambios.

---
*Generado por AntiGravity - IT Support System*
