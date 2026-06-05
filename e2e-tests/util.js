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

        const args = [];
        for(const arg of msg.args()) args.push(await arg.jsonValue());

        console.log(
          `[${browserName}] [console.${msg.type()}] ${url}:${line}:${column}` +
          `\n    message:`, ...args,
        );
      });
      await use();
    },
    { auto:true },
  ],
});

export {
  expect,
  test,
  login,
  ENCRYPTION_SECRET
};
