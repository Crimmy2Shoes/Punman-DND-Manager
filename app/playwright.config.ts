import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests',
  testIgnore: 'player.spec.ts',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4175',
    headless: true,
    launchOptions: {
      executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm.cmd run preview -- --host localhost --port 4175 --strictPort',
    url: 'http://localhost:4175',
    reuseExistingServer: false,
    timeout: 30000,
  },
})
