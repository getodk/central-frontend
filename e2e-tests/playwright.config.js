import { defineConfig, devices } from '@playwright/test';

const reporter = [ ['list'] ];
if(process.env.CI) reporter.push(['github']);
else               reporter.push(['html']);

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: '.',
  /* Maximum time one test can run for. */
  timeout: 10 * 1000,
  /* Maximum time a single assertion can wait for. */
  expect: {
    timeout: 2_000,
  },
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Bail after first test failure in CI */
  maxFailures: process.env.CI ? 1 : undefined,
  /* Do not retry failed tests. */
  retries: 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter,
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'allow'
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: 'global.setup.js',
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: 'global.teardown.js',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    }
  ]
});
