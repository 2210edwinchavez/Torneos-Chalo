import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/** Misma ruta pública que `APP_LOGO_URL` en branding. */
const LOGO_PATH = '/chalosport-logo.png'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const site = (env.VITE_APP_URL || 'https://chalosports-app.vercel.app').replace(/\/$/, '')
  const ogImage = `${site}${LOGO_PATH}`

  return {
    plugins: [
      react(),
      {
        name: 'chalosports-og-meta',
        transformIndexHtml(html) {
          const block = `
    <meta name="description" content="CHALOSPORTS: torneos, equipos, partidos y goleadores." />
    <link rel="icon" type="image/png" href="${LOGO_PATH}" />
    <link rel="apple-touch-icon" href="${LOGO_PATH}" />
    <meta property="og:site_name" content="CHALOSPORTS" />
    <meta property="og:title" content="CHALOSPORTS — Gestión de torneos" />
    <meta property="og:description" content="Gestiona torneos, equipos, jugadores y resultados desde un solo lugar." />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:alt" content="CHALOSPORTS" />
    <meta property="og:url" content="${site}/" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="CHALOSPORTS — Gestión de torneos" />
    <meta name="twitter:description" content="Gestiona torneos, equipos, jugadores y resultados." />
    <meta name="twitter:image" content="${ogImage}" />`
          return html.replace('</head>', `${block}\n  </head>`)
        },
      },
    ],
    server: {
      host: true,
      port: 5173,
    },
  }
})
