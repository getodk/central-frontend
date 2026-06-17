import { expect, test as testBase } from '@playwright/test';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const ENCRYPTION_SECRET = 'encryptionsecret';

const login = async (page) => {
  await page.goto(appUrl);
  await expect(page.getByRole('heading', { name: 'Welcome to ODK Central' })).toBeVisible();

  await page.getByPlaceholder('email address').fill(user);
  await page.getByPlaceholder('password').fill(password);

  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForURL(appUrl);
};

const test = testBase.extend({
  // See: https://playwright.dev/docs/test-fixtures#adding-global-beforeeachaftereach-hooks
  browserConsoleToTestStdout: [
    async ({ browserName, page }, use) => {
      page.on('console', msg => {
        const { url, line, column } = msg.location();

        const message = msg.text();

        // See: /apps/central/src/composables/feature-flags.js
        if(message.includes('ODK Central Alpha Features:')) return;

        if(browserName === 'firefox') {
          // See: https://github.com/getodk/central/issues/1986
          if(message.match(/"downloadable font: glyf: Glyph bbox was incorrect;.*font-family: "FontAwesome"/)) return;

          // See: https://github.com/getodk/central/issues/1989
          if(message.match(/"downloadable font: glyf: Glyph bbox was incorrect;.*font-family: "icomoon"/)) return;

          // See: https://github.com/enketo/enketo/issues/1540
          if(message.match(/"downloadable font: glyf: Glyph bbox was incorrect;.*font-family: "OpenSans"/)) return;
        }

        if(browserName === 'chromium') {
          // See: https://github.com/getodk/central/issues/1997
          if(url.endsWith('/v1/config/analytics') && message.includes('404 (Not Found)')) return;

          if(message.includes('Failed to load resource: the server responded with a status of 401 (Unauthorized)')) {
            if(url.endsWith('/v1/sessions/restore')) return;

            // See: https://github.com/getodk/central/issues/1686
            if(url.includes('/-/submission/max-size/')) return;
          }
        }

        if(url.includes('/-/')) {
          // Ensure enketo offline mode is activated as expected.
          // See: https://github.com/getodk/central/issues/1987
          if(message === 'App in offline-capable mode.' &&  url.includes('/x/')) return;
          if(message === 'App in online-only mode.'     && !url.includes('/x/')) return;
          
          if(message === 'Keeping default theme.') return;
        }

        console.log(
          `[${browserName}|console.${msg.type()}] ${url}:${line}:${column}` +
          `\n    message:`, message,
        );
      });
      await use();
    },
    { auto:true },
  ],
});

export {
  test,
  login,
  ENCRYPTION_SECRET
};
