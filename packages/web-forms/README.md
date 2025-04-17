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

### Styling Overview

This project uses a combination of [PrimeFlex](https://primeflex.org/) and [PrimeVue](https://primevue.org/) for consistent styling, alongside specific font rules for the ODK Website's Web Forms Preview.

- **PrimeFlex**: A CSS utility library used for layout-related properties such as positioning (e.g., flexbox, grid), responsive breakpoints, font-size and font-weight adjustments.
- **PrimeVue**: A UI component library that defines the visual design of components, including shapes (e.g., borders, rounded corners) and color schemes.

#### Theming with CSS Variables

We use CSS variables for theming with two prefixes:

- `--p-` Prefix: Variables prefixed with `--p-` (e.g., `--p-primary-50`) come from PrimeVue and control its component styles (e.g., colors, borders). These are part of PrimeVue’s [theming system](https://primevue.org/theming/styled/).
- `--odk-` Prefix: Variables prefixed with `--odk-` (e.g., `--odk-font-family`) are custom to this project and manage styles outside PrimeVue or PrimeFlex, such as application-specific typography.

#### Fonts

Form elements use `font-family: Roboto, sans-serif;` for accessibility and a clean, readable appearance.

#### Material Design

This package uses the Material Design system for the UI, though not strictly. The idea is to closely match the design to that of [ODK Collect](https://docs.getodk.org/collect-intro/).

### Icons

We use **Material Icons** using IcoMoon to select a subset of icons in order to minimize the size. The font files are located in [`./src/assets/fonts/`](./src/assets/fonts/), and the CSS is [`./src/assets/css/icomoon.css`](/src/assets/css/icomoon.css). Our IcoMoon definition is in the root directory of this package at [`./icomoon.json`](./icomoon.json).

To update the icons using the [IcoMoon website](https://icomoon.io/app/):

1. Click the "Import Icons" button in IcoMoon. Select [`icomoon.json`](/icomoon.json). When prompted, load the settings stored in the file.
2. Scroll down to the "Add Icons From Library" link and add **Material Icons**.
3. Move the imported set above Material Icons, using the 3-bar icon to the right of the imported set's title. (This should help preserve the icon order and minimize the diff.)
4. Update the icons by selecting (highlighting) the new icons to add. They don't need to be moved or altered.
5. Download the new font, then copy the files (`icomoon.css`, `fonts/*`, `icomoon.json`) into their locations in the repository.
   - You will need to rename the files and update the paths in the CSS (`fonts/icomoon.ttf?...` becomes `/fonts/icomoon.ttf?...` with a beginning slash).
   - You will also need to prettify the JSON file to use two space indentation.

By following the steps above, you should minimize the diff. However, in the JSON file, you may still see changes for properties like `id`, `iconIdx`, `setId`, and `setIdx`.

Material Icons are available under the Apache License Version 2.0. Copy of the license can be found at [`./src/assets/fonts/LICENSE-2.0.txt`](./src/assets/fonts/LICENSE-2.0.txt)
