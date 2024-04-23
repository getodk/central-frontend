# @odk-web-forms/ui-vue

This is a Vue component library that uses [`@odk-web-forms/xforms-engine`](../xforms-engine/) to render ODK XForms.

## Usage

To use this library in a Vue.js application:

1. Import `@odk-web-forms/ui-vue` as a dependency in the application
2. Install the exported plugin by adding app.use(WebFormsPlugin) in entry component (usually App.vue)
3. Add the exported component anywhere in the application:

```html
<OdkWebForm :form-xml="formVersionXml.data" @submit="handleSubmit" />
```

**Plugin:**

Plugin is there to initialize PrimeVue, currently it exposes no options. In future, various configuration options might be added to the plugin.

**Props and Events:**

- `form-xml`: the XML of ODK XForm to be rendered.
- `submit`: it is raised when user pressed "Send" button on the Form.

## Development

To run in development, run this command at the monorepo root:

```sh
yarn workspace @odk-web-forms/scenario dev
```

Individual test environments, and their corresponding watch modes, also have separate commands which can be found in [`package.json`](./package.json).

### Material Design

This package uses Material Design system for the UI, though not strictly. The idea is to closely match the design to that of ODK Collect.

For Material Components and layout, it is using PrimeVue component library.

### Theme and Styles

We are using customized version of Material Light Indigo theme provided by the PrimeVue. All customization is done in [`./themes/2024-light/theme.scss`](./themes/2024-light/theme.scss) file. We tend to define all css rules in that file so that in future we could support shipping multiple themes at the same time, However, this approach is flexible and subject to change in the near future.

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
