import { defineConfig } from '@playwright/test'
import base from './playwright.config'
export default defineConfig({
  ...base,
  testIgnore: [],
  testMatch: 'player.spec.ts',
  use: { ...base.use, baseURL: 'http://localhost:4176' },
  webServer: {
    command: 'npm.cmd run preview:players -- --host localhost --port 4176 --strictPort',
    url: 'http://localhost:4176',
    reuseExistingServer: false,
    timeout: 30000,
  },
})
