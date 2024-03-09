# ODK Web Forms

[ODK XForms](https://getodk.github.io/xforms-spec/#:~:text=The%20ODK%20XForms%20specification%20is,in%20the%20W3C%20XForms%20specification.) for the web. This package is still in very early stages!

## Install

Install with `npm` (or the equivalent command for your preferred package manager):

```sh
npm install @odk-web-forms/xforms-engine
```

## Development

> **Note**
> All commands should be run from the root of the monorepo, not this package's subdirectory.

To run @odk-web-forms/xforms-engine in development mode:

```sh
yarn workspace @odk-web-forms/xforms-engine dev
```

Test commands:

```sh
# Single run
yarn workspace @odk-web-forms/xforms-engine test-node:jsdom
yarn workspace @odk-web-forms/xforms-engine test-browser:chromium
yarn workspace @odk-web-forms/xforms-engine test-browser:firefox
yarn workspace @odk-web-forms/xforms-engine test-browser:webkit

# Watch mode (convenient during development)
yarn workspace @odk-web-forms/xforms-engine test-watch:jsdom
yarn workspace @odk-web-forms/xforms-engine test-watch:chromium
yarn workspace @odk-web-forms/xforms-engine test-watch:firefox
yarn workspace @odk-web-forms/xforms-engine test-watch:webkit
```

### Project structure (WIP)

As noted, this package is still young. This structure may change as development progresses, but this captures the general intent for now.

#### Components

Aspects of a form concerned with presentation and user interaction are developed as components, under the `src/components` directory. These components are further structured by abstraction/composition layer and/or domain concern, e.g.:

- `src/styled`: concerned only with presentation—generally visual, typically augmenting base Material UI components provided by [SUID](https://suid.io/)
- `src/components/XForm`: designed to take XForms data (either raw or parsed into runtime data structures used throughout the system) and render form UI, generally deferring to more user-/UI-specialized components
- `src/components/Widget`: intended to correspond as closely as possible to [ODK Collect](https://docs.getodk.org/form-question-types/) question types (there also referred to as "widgets" at this time)
- `src/components/XForm/controls`: specific to visible form controls as defined in an XForm's `body`
- `src/components/XForm/debugging`: as the name suggests, these are being used to convey visible developer-facing information about aspects of the rendered form which might be of interest (and should this concept persist, they would not be user facing outside of development)
- The remaining components are named, and grouped where appropriate, around user-facing features or sets of related features

Being (again) early stages, this structure is mostly an aspirational attempt at conveying a sense of where abstraction and composition boundaries are anticipated for the view layer. All are subject to change and refinement.

#### Non-view logic

All non-view logic is presently implemented in `src/lib`. It is highly likely that this will be reduced to more conventional "library"-style logic, with e.g. XForms-specific implementation details broken out into a more explicit structure. This aspect of code organization was deferred until more of that logic is introduced.

## Supported/tested environments

- Browsers (latest versions):
  - Chrome/Chromium-based browsers (tested only in Chromium)
  - Firefox
  - Safari/WebKit (tested in WebKit directly)
- Non-browser runtimes with a DOM compatibility environement:
  - Node (current/LTS; tested with [jsdom](https://github.com/jsdom/jsdom)). Server-side rendering of forms is not presently supported or targeted beyond testing, though it may be considered in the future. Inclusion of Node in the automated test suites helps us to keep this option open.
