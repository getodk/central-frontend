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
      page.on('console', async msg => {
        const { url, line, column } = msg.location();

        const message = browserName === 'firefox' ? await asText(msg) : msg.text();

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

async function asText(msg) {
  const basicMessage = msg.text();
  try {
    const args = await Promise.all(msg.args().map(arg => arg.evaluate(a => {
      try {
        if(a instanceof Error) return `${a}\n${filteredStack(a)}`;
        if(a && typeof a === 'object') return JSON.stringify(a);
        return String(a);
      } catch(err) {
        return `Failed to deserialise JSHandle: ${err}`;
      }
    })));
    return args.join(' ');
  } catch(err) {
    // Handle race condition: `Error: jsHandle.evaluate: Execution context was destroyed, most likely because of a navigation`
    return `Failed async deserialisation: ${err}; msg.text(): ${basicMessage}`;
  }

  function filteredStack({ stack }) {
    return stack
        .split('\n')
        .reduce((acc, line) => {
          const prev = acc.at(-1);

          if(line.match(/@http:\/\/central-test\.localhost\/assets\/runtime-core\.esm-bundler-\w+\.js:\d+:\d+$/)) {
            if(prev?.count) ++prev.count;
            else acc.push({ count:1 });
          } else acc.push(line);

          return acc;
        }, [])
        .map(it => typeof it === 'string' ? it : `<${it.count} references to runtime-core.esm-bundler omitted>`)
        .join('\n');
  }
}

export {
  test,
  login,
  ENCRYPTION_SECRET
};
