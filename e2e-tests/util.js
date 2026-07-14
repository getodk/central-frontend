import { expect, test as testBase } from '@playwright/test';

const appUrl = process.env.ODK_URL;
const user = process.env.ODK_USER;
const password = process.env.ODK_PASSWORD;
const ENCRYPTION_SECRET = 'encryptionsecret';

const submitLogin = async (page) => {
  await page.getByPlaceholder('email address').fill(user);
  await page.getByPlaceholder('password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

const login = async (page) => {
  await page.goto(appUrl);
  await expect(page.getByRole('heading', { name: 'Welcome to ODK Central' })).toBeVisible();
  await submitLogin(page);
  await page.waitForURL(appUrl);
};

const test = testBase.extend({
  // See: https://playwright.dev/docs/test-fixtures#adding-global-beforeeachaftereach-hooks
  browserConsoleToTestStdout: [
    async ({ browserName, page }, use) => {
      const fatals = [];

      page.on('console', async msg => {
        const { url, line, column } = msg.location();

        const message = browserName === 'firefox' ? await asText(msg) : msg.text();

        if(browserName === 'firefox') {
          // See: https://github.com/getodk/central/issues/1986
          if(message.match(/"downloadable font: glyf: Glyph bbox was incorrect;.*font-family: "FontAwesome"/)) return;

          // See: https://github.com/getodk/central/issues/1989
          if(message.match(/"downloadable font: glyf: Glyph bbox was incorrect;.*font-family: "icomoon"/)) return;

          // See: https://github.com/enketo/enketo/issues/1540
          if(message.match(/"downloadable font: glyf: Glyph bbox was incorrect;.*font-family: "OpenSans"/)) return;

          // See: https://github.com/getodk/central/issues/1696
          if(message.includes('XML Parsing Error: unclosed token')) return;
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

        const fullMessage =
          `[${browserName}|console.${msg.type()}] ${url}:${line}:${column}` +
          `\n    message: ${message}`;
        console.log(fullMessage);

        gatherUnexpectedLogs(fatals, msg, message);
      });

      await use();

      await expect(
        fatals,
        `Unexpected fatal error(s) logged: ${fatals.map((logged, idx) => `\n    ${idx}. ${logged}`).join('')}`,
      ).toHaveLength(0);
    },
    { auto:true },
  ],
});

const expectedErrors = [
  // https://github.com/enketo/enketo/issues/990#issuecomment-1831189281
  (msg, message) => msg.location().url.endsWith('://central-test.localhost/-/x/images/offline-enabled.png')
                    && message === 'Failed to load resource: net::ERR_FAILED',

  // https://github.com/getodk/central/issues/1686
  'Error retrieving maximum submission size. Unexpected response:  {code: 401, message: Forbidden. Authorization Required.}',

  // https://github.com/getodk/central/issues/1915
  new RegExp(`Loading the image 'http://.*' violates the following Content Security Policy directive: "img-src .*https:.*".`),

  // https://github.com/getodk/central/issues/2056
  "Refused to execute script from 'http://central-test.localhost/apps/forms/src/init.js' because its MIME type ('text/html') is not executable, and strict MIME type checking is enabled.",
];

function gatherUnexpectedLogs(fatals, msg, message) {
  switch(msg.type()) {
    case 'log':
    case 'debug':
    case 'info':
    case 'trace':
    case 'startGroup':
    case 'startGroupCollapsed':
    case 'endGroup':
    case 'profile':
    case 'profileEnd':
    case 'table':
      /* probably not fatal */
      return;
  }

  if(expectedErrors.some(expected => {
    if(typeof expected === 'string')   return message === expected;
    if(typeof expected === 'function') return expected(msg, message);
    if(expected instanceof RegExp)     return message.match(expected);
    throw new Error(`Unsupported expectation of type "${typeof expected}":`, expected);
  })) return;

  // Include fullMessage here, as it may otherwise be lost(??)
  fatals.push(fullMessage);
}

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
    })));
    return args.join(' ');
  } catch(err) {
    // Handle race condition: `Error: jsHandle.evaluate: Execution context was destroyed, most likely because of a navigation`
    return `Failed async deserialisation: ${err}; msg.text(): ${basicMessage}`;
  }
}

export {
  test,
  login,
  submitLogin,
  ENCRYPTION_SECRET
};
