import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig(({ mode, command }) => {
  const players = mode === 'players'
  const env = loadEnv(mode, process.cwd())
  if (players && loadEnv(mode, process.cwd()).VITE_APP_MODE !== 'player')
    throw Error(
      'Player builds require VITE_APP_MODE=player. Remove conflicting overrides from .env.local.',
    )
  if (
    players &&
    command === 'build' &&
    !/^[a-zA-Z0-9.-]+\.apps\.googleusercontent\.com$/.test(
      loadEnv(mode, process.cwd()).VITE_GOOGLE_CLIENT_ID || '',
    )
  )
    throw Error('Set VITE_GOOGLE_CLIENT_ID in .env.local before building the player app.')
  return {
    base: env.VITE_BASE_PATH || '/',
    publicDir: players ? 'player-public' : 'public',
    build: { outDir: players ? 'dist-players' : 'dist' },
    plugins: [
      react(),
      ...(players
        ? []
        : [
            VitePWA({
              strategies: 'injectManifest',
              srcDir: 'src',
              filename: 'sw.ts',
              registerType: 'prompt',
              includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'Install_Pugilist.gs'],
              manifest: {
                name: 'Punman’s Character Journal',
                short_name: 'Character Journal',
                description: 'A character companion for your PunPun Google spreadsheet.',
                theme_color: '#7e3042',
                background_color: '#f3efe6',
                display: 'standalone',
                start_url: '.',
                scope: '.',
                icons: [
                  { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
                  { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
                  { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
                ],
              },
              injectManifest: {
                globPatterns: ['**/*.{js,css,html,svg,png,json,webmanifest}'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
              },
              devOptions: { enabled: false },
            }),
          ]),
    ],
  }
})
