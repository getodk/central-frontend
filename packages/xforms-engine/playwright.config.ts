import { defineConfig } from '@playwright/test';

const isCI = Boolean(process.env.CI);

// NOTE: Sometimes, tests fail with `TypeError: process.stdout.clearLine is not a function`
// for some reason. This comes from Vite, and is conditionally called based on `isTTY`.
// We set it to false here to skip this odd behavior.
process.stdout.isTTY = false;

const config = defineConfig({
	testMatch: 'e2e/*.test.ts',
	/* Maximum time one test can run for. */
	timeout: 40 * 1000,
	expect: {
		/**
		 * Maximum time expect() should wait for the condition to be met.
		 * For example in `await expect(locator).toHaveText();`
		 */
		timeout: 4 * 1000,
	},
	/* Fail the build on CI if you accidentally left test in the source code. */
	forbidOnly: isCI,
	/* Retry on CI only */
	retries: isCI ? 3 : 0,
	/* Opt out of parallel tests on CI. */
	workers: isCI ? 1 : '50%',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
		actionTimeout: 0,
		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},
	webServer: {
		command: 'yarn dev',
		port: 8675,
	},
	projects: [
		{
			name: 'Chromium',
			use: {
				browserName: 'chromium',
				channel: 'chromium',
			},
		},
		{
			name: 'Firefox',
			use: {
				browserName: 'firefox',
				channel: 'firefox',
			},
		},
		{
			name: 'WebKit',
			use: {
				browserName: 'webkit',
				channel: 'webkit',
			},
		},
	],
});

export default config;
