import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end smoke tests: they drive the production build in demo mode, in the Chrome that's
 * already installed (locally and on GitHub's runners), so no separate browser download is needed.
 * Run `npm run build` first; `npm run e2e` does both.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4180',
    channel: 'chrome',
    timezoneId: 'Europe/London',
    locale: 'en-GB',
    // Skips confetti and long animations, so the tests are quicker and steadier.
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'phone', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
  webServer: {
    command: 'node e2e/serve.mjs',
    url: 'http://localhost:4180',
    reuseExistingServer: !process.env.CI,
  },
})
