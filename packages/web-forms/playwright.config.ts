import { defineConfig, devices } from '@playwright/test';
import process from 'node:process';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

const snapshotPath = '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: './e2e',
	/* Maximum time one test can run for. */
	timeout: 60 * 1000,
	expect: {
		/**
		 * Maximum time expect() should wait for the condition to be met.
		 * For example in `await expect(locator).toHaveText();`
		 */
		timeout: 5000,
	},
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: !!process.env.CI,
	/* Retry on CI only */
	retries: process.env.CI ? 2 : 0,
	/* Opt out of parallel tests on CI. */
	workers: process.env.CI ? 1 : undefined,
	/* Reporter to use. See https://playwright.dev/docs/test-reporters */
	reporter: 'html',
	/* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
	use: {
		/* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
		actionTimeout: 0,
		/* Base URL to use in actions like `await page.goto('/')`. */
		baseURL: 'http://localhost:5173',

		/* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
		trace: 'on-first-retry',
	},

	/* Configure projects for major browsers */
	projects: [
		{
			name: 'functional-chromium',
			testMatch: ['**/functional/*.test.ts', '**/build/*.test.ts'],
			use: {
				...devices['Desktop Chrome'],
				//Chrome-specific permissions for test cases requiring copy/paste actions
				contextOptions: { permissions: ['clipboard-read', 'clipboard-write'] },
				headless: true,
			},
		},
		{
			name: 'functional-firefox',
			testMatch: ['**/functional/*.test.ts', '**/build/*.test.ts'],
			use: { ...devices['Desktop Firefox'], headless: true },
		},
		{
			name: 'functional-webkit',
			testMatch: ['**/functional/*.test.ts', '**/build/*.test.ts'],
			use: { ...devices['Desktop Safari'], headless: true },
		},
		{
			name: 'visual-chromium',
			testMatch: ['**/visual/*.test.ts'],
			snapshotPathTemplate: `${snapshotPath}{arg}-chromium{ext}`,
			use: {
				...devices['Desktop Chrome'],
				//Chrome-specific permissions for test cases requiring copy/paste actions
				contextOptions: { permissions: ['clipboard-read', 'clipboard-write'] },
				// This argument is needed for visual tests on CI's Linux Chrome.
				launchOptions: { args: ['--ignore-gpu-blocklist'] },
				headless: false, // Turning headless off to compare snapshots in CI
			},
		},
		{
			name: 'visual-firefox',
			testMatch: ['**/visual/*.test.ts'],
			snapshotPathTemplate: `${snapshotPath}{arg}-firefox{ext}`,
			// Turning headless off to compare snapshots in CI
			use: { ...devices['Desktop Firefox'], headless: false },
		},
		{
			name: 'visual-webkit',
			testMatch: ['**/visual/*.test.ts'],
			snapshotPathTemplate: `${snapshotPath}{arg}-webkit{ext}`,
			// Turning headless off to compare snapshots in CI
			use: { ...devices['Desktop Safari'], headless: false },
		},

		/* Test against mobile viewports. */
		// {
		//   name: 'Mobile Chrome',
		//   use: {
		//     ...devices['Pixel 5'],
		//   },
		// },
		// {
		//   name: 'Mobile Safari',
		//   use: {
		//     ...devices['iPhone 12'],
		//   },
		// },

		/* Test against branded browsers. */
		// {
		//   name: 'Microsoft Edge',
		//   use: {
		//     channel: 'msedge',
		//   },
		// },
		// {
		//   name: 'Google Chrome',
		//   use: {
		//     channel: 'chrome',
		//   },
		// },
	],

	/* Folder for test artifacts such as screenshots, videos, traces, etc. */
	// outputDir: 'test-results/',

	/* Run your local dev server before starting the tests */
	webServer: [
		/**
		 * Serve dev mode: for testing with demo/fixtures
		 */
		{
			command: 'yarn dev',
			port: 5173,
			reuseExistingServer: !process.env.CI,
		},

		/**
		 * Serve minimal integration of build product: for testing styles, any other
		 * aspects of build product we wish to validate.
		 */
		{
			command: 'yarn dist-demo',
			port: 5174,
			reuseExistingServer: false,
		},
	],
});
