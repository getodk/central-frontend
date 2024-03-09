const config = {
	testMatch: 'e2e/**/*.test.ts',
	forbidOnly: !!process.env.CI,
	projects: [
		{
			name: 'Chrome Stable',
			use: {
				browserName: 'chromium',
				channel: 'chrome',
			},
		},
	],
};

export default config;
