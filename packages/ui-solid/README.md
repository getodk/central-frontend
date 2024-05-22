# @getodk/ui-solid

A [Solid](https://www.solidjs.com/) UI for ODK Web Forms; currently a reference client of [`@getodk/xforms-engine`][xforms-engine].

> [!NOTE]
> The future of this package is unclear! Its current state reflects an early spike/prototyping effort to explore viability of the ODK Web Forms project. As development of the project proceeds overall, it is likely that the [Vue client](../web-forms/) will be be more mature and actively developed.

## Install

Install with `npm` (or the equivalent command for your preferred package manager):

```sh
npm install @getodk/ui-solid
```

## Development

> [!NOTE]
> All commands should be run from the root of the monorepo, not this package's subdirectory.

To run in development mode:

```sh
yarn workspace @getodk/ui-solid dev
```

Test commands:

```sh
# Single run
yarn workspace @getodk/ui-solid test-node:jsdom
yarn workspace @getodk/ui-solid test-browser:chromium
yarn workspace @getodk/ui-solid test-browser:firefox
yarn workspace @getodk/ui-solid test-browser:webkit

# Watch mode (convenient during development)
yarn workspace @getodk/ui-solid test-watch:jsdom
yarn workspace @getodk/ui-solid test-watch:chromium
yarn workspace @getodk/ui-solid test-watch:firefox
yarn workspace @getodk/ui-solid test-watch:webkit
```

## Component structure

- `src/components/styled`: concerned only with presentation—generally visual, typically augmenting base Material UI components provided by [SUID](https://suid.io/)
- `src/components/XForm`: designed to take XForms data (either raw or parsed into runtime data structures used throughout the system) and render form UI, generally deferring to more user-/UI-specialized components
- `src/components/Widget`: intended to correspond as closely as possible to [ODK Collect](https://docs.getodk.org/form-question-types/) question types (there also referred to as "widgets" at this time)
- `src/components/XForm/controls`: specific to visible form controls as defined in an XForm's `body`
- `src/components/XForm/debugging`: as the name suggests, these are being used to convey visible developer-facing information about aspects of the rendered form which might be of interest (and should this concept persist, they would not be user facing outside of development)
- The remaining components are named, and grouped where appropriate, around user-facing features or sets of related features

This structure is mostly an aspirational attempt at conveying a sense of where abstraction and composition boundaries were/are anticipated for the view layer. All are subject to change and refinement, and may be superceded by the structure of the [Vue client][vue-client].

## Supported/tested environments

- Browsers (latest versions):
  - Chrome/Chromium-based browsers (tested only in Chromium)
  - Firefox
  - Safari/WebKit (tested in WebKit directly)
- Non-browser runtimes with a DOM compatibility environement:
  - Node (current/LTS; tested with [jsdom](https://github.com/jsdom/jsdom)). Server-side rendering of forms is not presently supported or targeted beyond testing, though it may be considered in the future. Inclusion of Node in the automated test suites helps us to keep this option open.

[xforms-engine]: ../xforms-engine/
[vue-client]: ../web-forms/
