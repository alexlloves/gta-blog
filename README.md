# GTA VI Community

Preguntas y respuestas sobre GTA 6, sin registro. Next.js 16 + Tailwind CSS 4 + Postgres (Neon).

## Desarrollo

```bash
npm install
npm run dev
```

Sin `DATABASE_URL`, los datos se guardan en el navegador (modo local).
Para usar una base de datos, copia `.env.example` a `.env.local` y pon tu cadena de conexión de Neon.

## Despliegue gratis (Vercel + Neon)

1. Sube el repositorio a GitHub.
2. En [vercel.com/new](https://vercel.com/new), importa el repositorio y pulsa **Deploy**.
3. En el proyecto de Vercel: **Storage → Create Database → Neon** (plan gratuito) y conéctala al proyecto.
   Vercel crea `DATABASE_URL` automáticamente.
4. **Deployments → Redeploy** para que la web use la base de datos.

Las tablas y las preguntas de ejemplo se crean solas en la primera visita.

## Estructura

- `src/app/api/data/route.ts`: API (lectura y acciones). La identidad anónima es una cookie httpOnly.
- `src/lib/server/`: conexión a Postgres, esquema y lógica con permisos.
- `src/lib/data/`: repositorio del cliente (API o localStorage) y store de React.
- `src/components/`: interfaz.
