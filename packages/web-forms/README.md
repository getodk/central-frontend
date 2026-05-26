# @getodk/web-forms

This package is a Vue component library that uses [`@getodk/xforms-engine`](../xforms-engine/) to render [ODK XForms](https://getodk.github.io/xforms-spec/). These forms are generally authored by end users in Excel using the [XLSForm](https://docs.getodk.org/xlsform/) standard. Learn more [on the ODK website](https://getodk.org/) and the ODK Web Form project's [main README](https://github.com/getodk/web-forms).

## Feature matrix

This section is auto generated. Please update `feature-matrix.json` and then run `npm run feature-matrix` from the repository's root to update it.

<!-- autogen: feature-matrix -->

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Question types (basic functionality)<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜ 91\%

  </summary>
  <br/>

| Feature <img width=250px/>                                 | Progress |
| ---------------------------------------------------------- | :------: |
| text                                                       |    ✅    |
| integer                                                    |    ✅    |
| decimal                                                    |    ✅    |
| note                                                       |    ✅    |
| select_one                                                 |    ✅    |
| select_multiple                                            |    ✅    |
| select\_\*\_from_file                                      |    ✅    |
| repeat                                                     |    ✅    |
| group                                                      |    ✅    |
| geopoint                                                   |    ✅    |
| geotrace                                                   |    ✅    |
| geoshape                                                   |    ✅    |
| start-geopoint                                             |    ✅    |
| range                                                      |    ✅    |
| image                                                      |    ✅    |
| barcode                                                    |          |
| audio                                                      |    ✅    |
| background-audio                                           |          |
| video                                                      |    ✅    |
| [file](https://github.com/getodk/web-forms/issues/370)     |    ✅    |
| [date](https://github.com/getodk/web-forms/issues/311)     |    ✅    |
| [time](https://github.com/getodk/web-forms/issues/590)     |    ✅    |
| [datetime](https://github.com/getodk/web-forms/issues/697) |    ✅    |
| rank                                                       |    ✅    |
| csv-external                                               |    ✅    |
| acknowledge                                                |    ✅    |
| start                                                      |    ✅    |
| end                                                        |    ✅    |
| today                                                      |    ✅    |
| deviceid                                                   |    ✅    |
| username                                                   |    ✅    |
| phonenumber                                                |    ✅    |
| email                                                      |    ✅    |
| audit                                                      |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Appearances<br/>🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜ 54\%

  </summary>
  <br/>

| Feature <img width=250px/>                                      | Progress |
| --------------------------------------------------------------- | :------: |
| numbers                                                         |    ✅    |
| multiline                                                       |    ✅    |
| url                                                             |          |
| ex:                                                             |          |
| thousands-sep                                                   |    ✅    |
| bearing                                                         |          |
| [vertical](https://github.com/getodk/web-forms/issues/271)      |          |
| [no-ticks](https://github.com/getodk/web-forms/issues/271)      |          |
| picker                                                          |          |
| [rating](https://github.com/getodk/web-forms/issues/711)        |    ✅    |
| new                                                             |          |
| new-front                                                       |          |
| [draw](https://github.com/getodk/web-forms/issues/698)          |    ✅    |
| [annotate](https://github.com/getodk/web-forms/issues/15)       |    ✅    |
| [signature](https://github.com/getodk/web-forms/issues/699)     |    ✅    |
| [no-calendar](https://github.com/getodk/web-forms/issues/781)   |          |
| [month-year](https://github.com/getodk/web-forms/issues/782)    |    ✅    |
| [year](https://github.com/getodk/web-forms/issues/782)          |    ✅    |
| [ethiopian](https://github.com/getodk/web-forms/issues/315)     |          |
| [coptic](https://github.com/getodk/web-forms/issues/315)        |          |
| [islamic](https://github.com/getodk/web-forms/issues/315)       |          |
| [bikram-sambat](https://github.com/getodk/web-forms/issues/315) |          |
| [myanmar](https://github.com/getodk/web-forms/issues/315)       |          |
| [persian](https://github.com/getodk/web-forms/issues/315)       |          |
| placement-map                                                   |    ✅    |
| maps                                                            |    ✅    |
| hide-input                                                      |          |
| minimal                                                         |    ✅    |
| search / autocomplete                                           |    ✅    |
| [quick](https://github.com/getodk/web-forms/issues/515)         |          |
| columns-pack                                                    |    ✅    |
| columns                                                         |    ✅    |
| columns-n                                                       |    ✅    |
| no-buttons                                                      |    ✅    |
| image-map                                                       |          |
| likert                                                          |    ✅    |
| map                                                             |    ✅    |
| field-list                                                      |    ✅    |
| label                                                           |    ✅    |
| list-nolabel                                                    |    ✅    |
| list                                                            |    ✅    |
| table-list                                                      |    ✅    |
| counter                                                         |          |
| hidden-answer                                                   |          |
| printer                                                         |          |
| masked                                                          |    ✅    |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Parameters<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜⬜ 66\%

  </summary>
  <br/>

| Feature <img width=250px/>                                                                                                         | Progress |
| ---------------------------------------------------------------------------------------------------------------------------------- | :------: |
| randomize                                                                                                                          |    ✅    |
| seed                                                                                                                               |    ✅    |
| value                                                                                                                              |    ✅    |
| label                                                                                                                              |    ✅    |
| rows                                                                                                                               |    ✅    |
| geopoint capture-accuracy,<br/>warning-accuracy, allow-mock-accuracy                                                               |    ✅    |
| range start, end, step                                                                                                             |    ✅    |
| [image max-pixels](https://github.com/getodk/web-forms/issues/397)                                                                 |    ✅    |
| audio quality                                                                                                                      |          |
| Audit: location-priority,<br/>location-min-interval, location-max-age,<br/>track-changes, track-changes-reasons,<br/>identify-user |          |
| [geotrace/shape incremental=true](https://github.com/getodk/web-forms/issues/562)                                                  |          |
| range labels, placeholder                                                                                                          |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Form logic<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩 100\%

  </summary>
  <br/>

| Feature <img width=250px/>                      | Progress |
| ----------------------------------------------- | :------: |
| calculate                                       |    ✅    |
| relevant                                        |    ✅    |
| required                                        |    ✅    |
| required message                                |    ✅    |
| custom constraint                               |    ✅    |
| constraint message                              |    ✅    |
| read only                                       |    ✅    |
| dynamic defaults (including trigger<br/>column) |    ✅    |
| choice filter                                   |    ✅    |
| default                                         |    ✅    |
| repeat_count                                    |    ✅    |
| create or update Entities                       |    ✅    |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Descriptions and annotations<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜⬜⬜ 75\%

  </summary>
  <br/>

| Feature <img width=250px/>                                     | Progress |
| -------------------------------------------------------------- | :------: |
| label                                                          |    ✅    |
| hint                                                           |    ✅    |
| [guidance hint](https://github.com/getodk/web-forms/issues/53) |          |
| form translations                                              |    ✅    |
| form translations with ref to other<br/>field                  |    ✅    |
| Markdown                                                       |    ✅    |
| Inline HTML                                                    |    ✅    |
| [image](https://github.com/getodk/web-forms/issues/30)         |    ✅    |
| big-image                                                      |          |
| [audio](https://github.com/getodk/web-forms/issues/30)         |    ✅    |
| [video](https://github.com/getodk/web-forms/issues/30)         |    ✅    |
| autoplay                                                       |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Theme and layouts<br/>🟩🟩🟩🟩⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 30\%

  </summary>
  <br/>

| Feature <img width=250px/>                                                 | Progress |
| -------------------------------------------------------------------------- | :------: |
| [grid](https://github.com/getodk/web-forms/issues/16)                      |          |
| [pages](https://github.com/getodk/web-forms/issues/254)                    |          |
| [logo](https://github.com/getodk/web-forms/issues/353)                     |          |
| [application translations](https://github.com/getodk/web-forms/issues/332) |          |
| [theme color](https://github.com/getodk/web-forms/issues/43)               |          |
| preview form                                                               |    ✅    |
| send instance                                                              |    ✅    |
| view instance                                                              |          |
| edit instance                                                              |    ✅    |
| table of contents                                                          |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### XPath<br/>🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩🟩⬜ 98\%

  </summary>
  <br/>

| Feature <img width=250px/>                                                                                    | Progress |
| ------------------------------------------------------------------------------------------------------------- | :------: |
| operators                                                                                                     |    ✅    |
| predicates                                                                                                    |    ✅    |
| axes                                                                                                          |    ✅    |
| string(\* arg)                                                                                                |    ✅    |
| concat(string arg*\|node-set arg*)                                                                            |    ✅    |
| join(string separator, node-set nodes\*)                                                                      |    ✅    |
| substr(string value, number start,<br/>number end?)                                                           |    ✅    |
| substring-before(string, string)                                                                              |    ✅    |
| substring-after(string, string)                                                                               |    ✅    |
| translate(string, string, string)                                                                             |    ✅    |
| string-length(string arg)                                                                                     |    ✅    |
| normalize-space(string arg?)                                                                                  |    ✅    |
| contains(string haystack, string needle)                                                                      |    ✅    |
| starts-with(string haystack, string<br/>needle)                                                               |    ✅    |
| ends-with(string haystack, string<br/>needle)                                                                 |    ✅    |
| uuid(number?)                                                                                                 |    ✅    |
| digest(string src, string algorithm,<br/>string encoding?)                                                    |    ✅    |
| pulldata(string instance_id, string<br/>desired_element, string query_element,<br/>string query)              |    ✅    |
| if(boolean condition, _ then, _ else)                                                                         |    ✅    |
| coalesce(string arg1, string arg2)                                                                            |    ✅    |
| once(string calc)                                                                                             |    ✅    |
| true()                                                                                                        |    ✅    |
| false()                                                                                                       |    ✅    |
| boolean(\* arg)                                                                                               |    ✅    |
| boolean-from-string(string arg)                                                                               |    ✅    |
| not(boolean arg)                                                                                              |    ✅    |
| regex(string value, string expression)                                                                        |    ✅    |
| checklist(number min, number max, string<br/>v\*)                                                             |    ✅    |
| weighted-checklist(number min, number<br/>max, [string v, string w]\*)                                        |    ✅    |
| number(\* arg)                                                                                                |    ✅    |
| random()                                                                                                      |    ✅    |
| int(number arg)                                                                                               |    ✅    |
| sum(node-set arg)                                                                                             |    ✅    |
| max(node-set arg\*)                                                                                           |    ✅    |
| min(node-set arg\*)                                                                                           |    ✅    |
| round(number arg, number decimals?)                                                                           |    ✅    |
| pow(number value, number power)                                                                               |    ✅    |
| log(number arg)                                                                                               |    ✅    |
| log10(number arg)                                                                                             |    ✅    |
| abs(number arg)                                                                                               |    ✅    |
| sin(number arg)                                                                                               |    ✅    |
| cos(number arg)                                                                                               |    ✅    |
| tan(number arg)                                                                                               |    ✅    |
| asin(number arg)                                                                                              |    ✅    |
| acos(number arg)                                                                                              |    ✅    |
| atan(number arg)                                                                                              |    ✅    |
| atan2(number arg, number arg)                                                                                 |    ✅    |
| sqrt(number arg)                                                                                              |    ✅    |
| exp(number arg)                                                                                               |    ✅    |
| exp10(number arg)                                                                                             |    ✅    |
| pi()                                                                                                          |    ✅    |
| count(node-set arg)                                                                                           |    ✅    |
| count-non-empty(node-set arg)                                                                                 |    ✅    |
| position(node arg?)                                                                                           |    ✅    |
| instance(string id)                                                                                           |    ✅    |
| current()                                                                                                     |    ✅    |
| randomize(node-set arg, number seed)                                                                          |    ✅    |
| today()                                                                                                       |    ✅    |
| now()                                                                                                         |    ✅    |
| format-date(date value, string format)                                                                        |    ✅    |
| format-date-time(dateTime value, string<br/>format)                                                           |    ✅    |
| date(\* value)                                                                                                |    ✅    |
| decimal-date-time(dateTime value)                                                                             |    ✅    |
| decimal-time(time value)                                                                                      |    ✅    |
| selected(string list, string value)                                                                           |    ✅    |
| selected-at(string list, number index)                                                                        |    ✅    |
| count-selected(node node)                                                                                     |    ✅    |
| jr:choice-name(node node, string value)                                                                       |    ✅    |
| jr:itext(string id)                                                                                           |    ✅    |
| indexed-repeat(node-set arg, node-set<br/>repeat1, number index1, [node-set<br/>repeatN, number indexN]{0,2}) |    ✅    |
| area(node-set ns\|geoshape gs)                                                                                |    ✅    |
| distance(node-set ns\|geoshape<br/>gs\|geotrace gt\|(geopoint\|string)<br/>arg\*)                             |    ✅    |
| geofence(geopoint p, geoshape gs)                                                                             |    ✅    |
| base64-decode(base64Binary input)                                                                             |    ✅    |
| [intersects(geoshape gs\|geotrace gt)](https://github.com/getodk/web-forms/issues/572)                        |          |

</details>

<details>
  <summary>

<!-- prettier-ignore -->
  ##### Misc<br/>⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜⬜ 0\%

  </summary>
  <br/>

| Feature <img width=250px/>                                                       | Progress |
| -------------------------------------------------------------------------------- | :------: |
| [last saved instance](https://github.com/getodk/web-forms/issues/306)            |          |
| [defaults from query parameters](https://github.com/getodk/web-forms/issues/464) |          |
| multi-form app-like experience                                                   |          |
| [prevent multiple submissions](https://github.com/getodk/web-forms/issues/461)   |          |
| configure end of form experience                                                 |          |
| save as draft                                                                    |          |
| offline entities                                                                 |          |
| MBtiles / offline map layers                                                     |          |
| [submission encryption](https://github.com/getodk/web-forms/issues/448)          |          |

</details>

<!-- /autogen: feature-matrix -->

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
    :preload-properties="preloadProperties"
    :track-device="true"
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

- `formXml` (`string`, required): The XML of the ODK XForm to be rendered.
- `fetchFormAttachment` (`FetchFormAttachment`, required): Function to fetch form attachments.
- `missingResourceBehavior` (`MissingResourceBehavior`, optional): Defines behavior when resources are missing.
- `submissionMaxSize` (`number`, optional): Maximum size for chunked submissions. Required when subscribing to `submitChunked` event.
- `attachmentMaxSize` (`number`, optional, defaults to 100MB): Maximum size for submission attachments in bytes.
- `editInstance` (`EditInstanceOptions`, optional): Options to resolve and load instance and attachment resources for editing.
- `preloadProperties` (`PreloadProperties`, optional): Properties to make available for binding in the form using jr:preload.
- `trackDevice` (`boolean`, optional, defaults to `false`): If `true`, generates a unique identifier for this device and stores it in `localstorage` for use in subsequent submissions. Ignored if `preloadProperties.deviceID` is given.

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
npm run dev -w=packages/web-forms
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
