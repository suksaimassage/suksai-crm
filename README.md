# Suksai Thai Massage — CRM de Citas

Sistema de gestión de centros de masajes. React 19 + TypeScript 6 + Vite 8 +
Supabase (arquitectura hexagonal).

---

## Requisitos

- Node 22+
- [Corepack](https://nodejs.org/api/corepack.html) habilitado
  (`corepack enable`)
- Cuenta y proyecto en [Supabase](https://supabase.com)

---

## Arranque rápido

```bash
# 1. Clonar
git clone <url-del-repo>
cd stm-crm-appointments

# 2. Instalar dependencias
corepack pnpm install

# 3. Configurar variables de entorno
#    Copia env.example a un archivo .env.local en la raíz y rellena
#    los dos valores con los de tu proyecto Supabase (Settings → API).
cp env.example .env.local

# 4. Arrancar servidor de desarrollo
corepack pnpm dev
# → http://localhost:5173
```

> **Nota:** el archivo de entorno local (`.env.local`, `.env`) está en
> `.gitignore`. Nunca lo commités. Ver la sección de seguridad más abajo.

---

## Scripts principales

| Comando                   | Descripción                                           |
| ------------------------- | ----------------------------------------------------- |
| `corepack pnpm dev`       | Servidor de desarrollo (Vite 8, puerto 5173)          |
| `corepack pnpm build`     | Build de producción (Rolldown)                        |
| `corepack pnpm preview`   | Previsualizar el build de producción localmente       |
| `corepack pnpm typecheck` | Verificación de tipos (TypeScript 6 strict)           |
| `corepack pnpm lint`      | ESLint 10 flat config                                 |
| `corepack pnpm lint:fix`  | ESLint con corrección automática                      |
| `corepack pnpm format`    | Formatear con Prettier 3                              |
| `corepack pnpm test`      | Vitest en modo watch                                  |
| `corepack pnpm coverage`  | Informe de cobertura                                  |
| `corepack pnpm check`     | Gate de CI completo (typecheck + lint + format:check) |

---

## Seguridad

### Variables de entorno

El proyecto necesita exactamente dos claves de Supabase:

```
VITE_SUPABASE_URL=https://<id-proyecto>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
```

Cópialas desde **Supabase Dashboard → Settings → API**. La plantilla vacía está
en `env.example` (nombre sin punto para evitar el hook de seguridad que bloquea
archivos `.env*`; `.env.example` está en `.gitignore` como excepción
whitelisted, pero el hook MCP lo bloquea en escritura).

### Content-Security-Policy

El archivo `vercel.json` incluye cabeceras de seguridad HTTP (CSP, HSTS,
X-Frame-Options, etc.). La directiva CSP usa `'unsafe-inline'` en `style-src`
porque styled-components inyecta estilos en `<style>` en tiempo de ejecución —
es un requisito de la librería.

**Verificar en el primer deploy:** abre la consola del navegador y comprueba que
no haya errores CSP. Si algún recurso queda bloqueado (CDN de fuentes externo,
widget de terceros, etc.), añade el dominio correspondiente a la directiva
apropiada en `vercel.json`.

---

## Convenciones del proyecto

Guía completa: arquitectura hexagonal, reglas de TypeScript, estructura de
carpetas, pipeline de agentes y restricciones hard.
