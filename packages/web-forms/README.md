# @getodk/web-forms

This package is a Vue component library that uses [`@getodk/xforms-engine`](../xforms-engine/) to render [ODK XForms](https://getodk.github.io/xforms-spec/). These forms are generally authored by end users in Excel using the [XLSForm](https://docs.getodk.org/xlsform/) standard. Learn more [on the ODK website](https://getodk.org/) and the ODK Web Form project's [main README](https://github.com/getodk/web-forms).

## Usage

To use this library in a Vue.js application:

1. Import `@getodk/web-forms` as a dependency in the application
2. Install the exported plugin by adding `app.use(WebFormsPlugin)` in entry component (usually App.vue)
3. Add the exported component anywhere in the application:

```html
<OdkWebForm
    :form-xml="formXml"
    :fetch-form-attachment="fetchAttachment"
    :missing-resource-behavior="missingBehavior"
    :submission-max-size="5242880"  <!-- 5MB -->
    :edit-instance="editOptions"
    @submit="handleSubmit"
    @submit-chunked="handleChunkedSubmit"
  />
```

### Plugin

The plugin is there to initialize PrimeVue, currently it exposes no options. In the future, configuration options may be added to the plugin.

```js
import { WebFormsPlugin } from '@getodk/web-forms';
app.use(WebFormsPlugin);
```

### Props (`OdkWebFormsProps`)

The `<OdkWebForm>` component accepts the following props:

- `formXml` (`string`, required): The XML of the ODK XForm to be rendered
- `fetchFormAttachment` (`FetchFormAttachment`, required): Function to fetch form attachments
- `missingResourceBehavior` (`MissingResourceBehavior`, optional): Defines behavior when resources are missing
- `submissionMaxSize` (`number`, optional): Maximum size for chunked submissions. Required when subscribing to `submitChunked` event
- `editInstance` (`EditInstanceOptions`, optional): Options to resolve and load instance and attachment resources for editing

### Events (`OdkWebFormEmits`)

The component emits the following events:

- `submit`: Emitted when the user presses the "Send" button on a valid form
  - Payload: ([submissionPayload: MonolithicInstancePayload, callback: HostSubmissionResultCallback])
- `submitChunked`: Emitted for chunked submissions when the form is valid
  - Payload: ([submissionPayload: ChunkedInstancePayload, callback: HostSubmissionResultCallback])
  - Note: Requires `submissionMaxSize` prop to be set

### What if I don't use Vue?

We will eventually publish a framework-agnostic custom element.

## Development

To run in development, run this command at the monorepo root:

```sh
yarn workspace @getodk/web-forms dev
```

Individual test environments, and their corresponding watch modes, also have separate commands which can be found in [`package.json`](./package.json).

Upload XLSForm and XForm functionality in [`demo`](./src/demo/) app and in dev mode depends on [XLSForm-online](https://github.com/getodk/xlsform-online). Run the xlsform-online locally. By default it runs on port 8000, if you are running it on another port then you should update the [`config`](./src/demo/config.json) file.

### Project Structure

```
web-forms/
├── public/                   # Static assets (e.g., favicon.ico)
├── src/
│   ├── assets/
│   │   ├── images/           # Web Forms and Demo page images
│   │   ├── styles/           # Web Forms and Demo page styles
│   ├── components/           # UI components
│   │   ├── form-elements/    # Form elements or controllers (question types, hints, labels, inputs)
│   │   ├── form-layout/      # Form layout and rendering (e.g., form panel, groups, repeats, form error classes)
│   │   ├── common/           # Reusable smaller components (e.g., icon, image, checkbox components)
│   ├── demo/                 # Demo page
│   ├── lib/                  # Utilities
│   ├── index.ts
│   ├── web-forms-plugin.ts   # Vue plugin
├── tests/                    # Unit tests
├── e2e/                      # E2e tests
├── package.json
├── vite.config.ts
├── playwright.config.ts
```

### Styling Overview

This project uses a combination of [PrimeFlex](https://primeflex.org/) and [PrimeVue](https://primevue.org/) for consistent styling, alongside specific font rules for the ODK Website's Web Forms Preview.

- **PrimeFlex**: A CSS utility library used for layout-related properties such as positioning (e.g., flexbox, grid), responsive breakpoints, font-size and font-weight adjustments.
- **PrimeVue**: A UI component library that defines the visual design of components, including shapes (e.g., borders, rounded corners) and color schemes.

#### Theming with CSS Variables

We use CSS variables for theming with two prefixes:

- `--p-` Prefix: Variables prefixed with `--p-` (e.g., `--p-primary-50`) come from PrimeVue and control its component styles (e.g., colors, borders). These are part of PrimeVue’s [theming system](https://primevue.org/theming/styled/).
- `--odk-` Prefix: Variables prefixed with `--odk-` (e.g., `--odk-font-family`) are custom to this project and manage styles outside PrimeVue or PrimeFlex, such as application-specific typography.

#### Z-Index Layering System

This package uses a centralized `z-index` layering system to manage UI stacking order, defined in `src/assets/styles/style.scss`. The ODK variables (e.g., `--odk-z-index-error-banner`) ensure elements like floating error messages, form controls, and overlays stack correctly without overlap.

- **Key layers**:
  - `--odk-z-index-base` (background)
  - `--odk-z-index-form-content` (inputs, buttons)
  - `--odk-z-index-form-floating` (highlights, tooltips)
  - `--odk-z-index-error-banner` (floating errors)
  - `--odk-z-index-overlay` (modals)
  - `--odk-z-index-topmost` (loaders, notifications)

- **Usage**: Apply with `z-index: var(--odk-z-index-error-banner);` on positioned elements (e.g., `position: absolute`).

#### Fonts

Form elements use `font-family: Roboto, sans-serif;` for accessibility and a clean, readable appearance.

#### Material Design

This package uses the Material Design system for the UI, though not strictly. The idea is to closely match the design to that of [ODK Collect](https://docs.getodk.org/collect-intro/).

### Icons

The `IconSVG` component renders Material Design Icons (MDI) with customizable size and style variants. It uses the `@mdi/js` library for icon data and supports a predefined set of icons.

```js
<IconSVG name="mdiCamera" size="md" variant="primary" />
```

To add a new icon:

- Import the icon from `@mdi/js` in the `IconSVG` component.
- Add the icon to the `iconMap` object with its corresponding name.
- Use the icon by passing its name to the `name` prop.

Material Icons are available under the Apache License Version 2.0. Copy of the license can be found at [`./src/assets/fonts/LICENSE-2.0.txt`](./src/assets/fonts/LICENSE-2.0.txt)
