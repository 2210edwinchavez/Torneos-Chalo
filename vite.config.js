import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['chalosport-logo.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'ChalóSport — Torneos',
          short_name: 'ChalóSport',
          description: 'Gestiona torneos, equipos, jugadores y resultados desde un solo lugar.',
          theme_color: '#84cc16',
          background_color: '#0a0f0a',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          lang: 'es',
          icons: [
            { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
          ],
        },
      }),
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
