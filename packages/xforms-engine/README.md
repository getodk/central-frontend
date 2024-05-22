# @getodk/xforms-engine

Implementation of the [ODK XForms specification](https://getodk.github.io/xforms-spec/)'s data model and computation logic. This package does not handle presentation or user interaction. Those aspects of forms are meant to be handled by a client. Presently, those clients are:

- [`@getodk/web-forms`](../web-forms)
- [`@getodk/ui-solid`](../ui-solid)

## Install

Install with `npm` (or the equivalent command for your preferred package manager):

```sh
npm install @getodk/xforms-engine
```

## Development

> [!NOTE]
> All commands should be run from the root of the monorepo, not this package's subdirectory.

Test commands:

```sh
# Single run
yarn workspace @getodk/xforms-engine test-node:jsdom
yarn workspace @getodk/xforms-engine test-browser:chromium
yarn workspace @getodk/xforms-engine test-browser:firefox
yarn workspace @getodk/xforms-engine test-browser:webkit

# Watch mode (convenient during development)
yarn workspace @getodk/xforms-engine test-watch:jsdom
yarn workspace @getodk/xforms-engine test-watch:chromium
yarn workspace @getodk/xforms-engine test-watch:firefox
yarn workspace @getodk/xforms-engine test-watch:webkit
```

## Supported/tested environments

- Browsers (latest versions):
  - Chrome/Chromium-based browsers (tested only in Chromium)
  - Firefox
  - Safari/WebKit (tested in WebKit directly)
- Non-browser runtimes with a DOM compatibility environement:
  - Node (current/LTS; tested with [jsdom](https://github.com/jsdom/jsdom)). Server-side rendering of forms is not presently supported or targeted beyond testing, though it may be considered in the future. Inclusion of Node in the automated test suites helps us to keep this option open.
