# @getodk/web-forms

## 0.24.0

### Minor Changes

- 86a54ab: Editing submissions no longer blocks until attachments have been downloaded
- 7ac5a19: Add support to datetime question type.
- a64d092: Add support for "month-year" and "year" date question type appearances.
- 500c8b2: Adds translation support.
- 024287c: Moved monorepo tree-sitter-xpath into separate repo

### Patch Changes

- 9ac1901: Fixed numeric inputs to update the UI when setvalue actions trigger
- c6856c5: Adjust the position of the media preview clear button.
- 4fc0e56: Fixed setvalue not firing when the field becomes relevant

## 0.23.1

### Patch Changes

- 8f1865c: Fixed images not allowed in file uploads

## 0.23.0

### Minor Changes

- 2eccd28: Added support for the file, audio, and video upload types, and implemented drag and drop for uploads

### Patch Changes

- 1795a20: Fixed csv parsing to allow files with single column
- 9818208: Fixed deviceid format to be shorter and more consistent with other clients
- dabf273: Changed the map tooltips to a dialog that explains the actions.
- 7b47bb1: Fixed a bug with markdown rendering outputs with empty values

## 0.22.0

### Minor Changes

- b454f1f: Added support for max-pixels parameter to scale down image files before upload
- 9df487b: Improved styling for disabled inputs to reduce confusion
- 361de3e: Added support for 'rating' appearance to range question types

### Patch Changes

- ffad6c4: Allow text selection in properties dialog and status bar
- e9f4e28: Fixed markdown to support computed link urls
- 5a9faa8: Fixed bug where unknown mimetype on an attachment would error when loading a form
- b83577f: Fix markdown to preserve line breaks
- d8985e7: Fix the display of the error banner on top of the map overlay.

## 0.21.0

### Minor Changes

- 965f6a9: Prevent displaying groups or repeats without relevant questions.

### Patch Changes

- 72bac16: Fixed markdown parser to ignore single labels that start with numbers instead of turning them into ordered lists
- 9262fd9: Add div to sanitizer allowlist to preserve inline styles
- 53e60da: Handle last-saved virtual secondary instance gracefully pending full implementation later
- aa8090a: Fixes integer and range codecs to not throw errors when given invalid data
- 14d6c9a: Fixed markdown to not interpret leading whitespace as a code block

## 0.20.0

### Minor Changes

- 90e5a03: Adds time question type

### Patch Changes

- 240a019: Fixes load submission data in maps
- 716bc51: Exclude demo images from core library bundle.
- f382254: Fixed a bug where editing forms with repeat counts caused odk-new-repeat events to fire and overwrite user entered values
- 12f943c: Prevents showing errors when starting new submissions
- fdc8b0a: Fixes spacing of elements in the map's status bar
- b2b6541: Prevents autofill in masked inputs and fixes long-form titles
- 507344e: Decimals and geopoint values are now serialized with a minimum of one digit after the decimal point

## 0.19.0

### Minor Changes

- 6bc1715: Improve map full-screen UX on mobile
- 8f49cfa: Adds geofence xpath function
- 4346971: Adds support for Geoshape and Geotrace.
- 6f682f3: Remove long-press interactions in maps
- def68e1: Update the current location indicator for maps
- 30a6a7c: Adds unlimited undo history for map interactions
- dc089de: Adds support for labels with audio and video
- a8f37a8: Remove “Get location” overlay from geopoint with placement-map
- e7fe47a: Remove the save button in geopoint with maps and placement-map appearances
- 859699c: Add support for the masked appearance
- 126e11d: Adds support for setgeopoint
- 653fb7f: Adds support for editing the coordinates in geoshape and geotrace question types.

### Patch Changes

- 72a4961: Allow for multiple setvalue actions to reference the same element
- 2276870: Removes temporal-polyfill from xpath bundle
- a3839c1: Fixes a range of memory leaks when resetting form instances
- da6dc94: Improves the UIUX of map status bar and fit to feature
- b6ed538: Parsing external instance csvs should be permissive of empty rows
- cd382fb: Set attribute value to instance value when editing submission
- 031d0d1: Adds a generated ID to markdown nodes to use as the key in vue loops
- c44525a: Fixed xforms-value-changed firing when loading submission for edit
- 3e695c7: Prevent background scroll and browser zooming in full-screen map
- ad6d0ba: Fixes odk-instance-first-load so it doesn't run on add repeat
- 14b65e4: Defer evaluation of translation elements to improve performance
- 265b8c4: Fix micro-panning interference, optimize full-screen UI and location tracking
- cc95fd2: Hide Entity special properties from the maps property dialog
- d1811f2: Fixes preload bindings so they only set the value on first load

## 0.18.2

### Patch Changes

- f5b706e: Fixes the xpath traversal code to support dynamic attributes
- 7908b30: Fixes actions so they are no longer reactive to model updates
- 40ea005: Fix Attributes to have the correct contextNode so `current()` works as expected
- 37015de: Fixes missing whitespace in panel headers

## 0.18.1

### Patch Changes

- 9252e91: Fix form reset to set preload parameters correctly

## 0.18.0

### Minor Changes

- 4025b67: Use Geopoint's placement mode when editing submissions.
- bac8412: Add support for all jr:preload options
- 6da0c6c: Add support for setvalue action and odk-instance-first-load, odk-new-repeat, xforms-value-changed events
- 79a21e4: Adds support for Geopoint with "maps" and "placement-map" appearances.

### Patch Changes

- 0be7d7c: Upgrade dependencies

## 0.17.0

### Minor Changes

- cf1c541: Support binding and serializing element attributes

### Patch Changes

- e547142: Enhanced sanitization of markdown input
- 7936df6: Minor increases in dependancies to resolve disclosed vulnerabilities

## 0.16.0

### Minor Changes

- 36b977f: Support select one from map
- ca8dc64: Refactor Group types so groups without a ref attribute are displayed
- d210211: Added support for markdown formatting in labels, hints, and constraints

### Patch Changes

- c7ed41b: Fix validation for the map's "zoom to features" action.
- 45a3d16: Adds map tile attribution
- daef669: Throw an error when jr:choice_name is called with a reference that does not exist
- 9a51706: Display an error on the map if graphics are disabled

## 0.15.0

### Minor Changes

- 0d4c5e6: Implemented base64-decode xpath function for decoding strings in forms
- 05db2e6: Added support for jr:choice-name function
- a2d3912: Support references to form fields in translated form text
- 9be65d9: Added pulldata function

## 0.14.0

### Minor Changes

- 6b3e6c0: Dropped support for Node.js version 18.
  - Added support for Node.js version 24.
  - Upgraded Vite to version 7, along with Vitest and other libraries that support Node.js versions greater than 20.

### Patch Changes

- 18895ad: Retrieve Web Forms version from package.json and build number from commit hash.
- 6a50728: Catch and handle http status error codes and provide a useful message to the client
- a8efeb0: Show error highlight on required questions
- 8214929: Fix display of list table's labels
- 8aff0d5: Limit integer fields to 9 characters.
  - Limit decimal fields to 15 characters.
  - Remove character limit and add support for the `thousands-sep` appearance in string fields with `numbers` appearance.
  - Improve handling of extra-long numbers by switching to a more reliable input field.
  - Fix an issue where commas in integer fields could cause errors.
- 8a56391: Upgrade dependencies to latest minor versions

## 0.13.1

### Patch Changes

- b05498c: Improves error dialog message and style.

## 0.13.0

### Minor Changes

- ca72cef: Improves UI of groups and repeats
- 15b64bb: Adds support for multiline appearance in input text

### Patch Changes

- e05918e: Improves rank's highlight effect when an option is moved to a new position
- d56adf1: Fixes select's search to filter by label
- 6ae5218: Fixes select question type when read-only is true

## 0.12.0

### Minor Changes

- e0ff340: Removes print button
- acaa7c6: Adds support for select with images

## 0.11.1

### Patch Changes

- 59d5257: Normalize Web Forms styles

## 0.11.0

### Minor Changes

- 3aedccb: Add support for a multiline text question type.

## 0.10.0

### Minor Changes

- b672955: Upgrades to PrimeVue v4. PrimeVue's components and style system (variables, colors, shapes, etc) have changed significantly.
- ab3be86: Support for date questions with no appearance and support for date notes.

### Patch Changes

- ea9674c: Adds icon component with Material Design icons to replace Icomoon
- 3e76d3a: Improve label/hint line breaks and repeat's add button styling

## 0.9.0

### Minor Changes

- 8261eee: Support for uploading images

### Patch Changes

- fd88153: Updates versions of dependencies
- e91e403: Updates versions of major dependencies
- 329f292: Adds E2E tests for Geopoint and Notes question types

## 0.8.0

### Minor Changes

- eb050c7: Added an empty state with an overlay for rank questions, requiring user interaction and treating non-interaction as a missed question.
- 3a096ab: Support resetting form state after submission
- 3152fe7: Support for editing submissions

## 0.7.0

### Minor Changes

- 46a1f1e: Emit submission payload when subscribed to `submit` event
  - Emit chunked submission payload when subscribed to new `submitChunked` event
- 81a57c3: Support for rank question types (`<odk:rank>`)
- e6d01b0: Partial support for `<range>` (basic horizontal and vertical sliders)
  - **FIX** setting `<select1>` values with spaces
  - **BREAKING CHANGE** (`@getodk/xforms-engine`): `SelectNode`'s write methods have been replaced with more ergonomic alternatives
- 99295eb: Support for geopoint questions with no appearance
  - Support for geopoint notes

### Patch Changes

- 0287a16: Fix: include namespace declarations in submission XML
- a08e77b: Fix: include primary instance root attributes in submission XML

## 0.6.0

### Minor Changes

- fcda4d8: Support for numeric controls:
  - inputs with `int` and `decimal` types
  - inputs with `appearance="numbers"`
  - (all types) support for `appearance="thousands-sep"`

- 2fddcec: Support for external secondary instances (XML, CSV, GeoJSON)

## 0.5.0

### Minor Changes

- 27c440d: Basic presentation of form load failures
- 1cae631: Show web-forms version in the footer.

## 0.4.0

### Minor Changes

- 6fb1054: Engine support for `<trigger>`

### Patch Changes

- c3b7165: - Fix: unsupported controls treated as `ModelValueNode`
  - Stub unsupported control nodes: `range`, `odk:rank`, `upload`

## 0.3.0

### Minor Changes

- 82d35d0: Validation of `required` and `constraint`
  - Show message when `required` or `constraint` are not satisfied.
  - Show error message banner at the top of the Form when "Send" button is pressed and the Form is invalid
  - Various design/UI tweaks to beautify the Form
- 7b63159: Add support for count-controlled (`jr:count`) and fixed (`jr:noAddRemove`) repeat ranges.
- 573b06b: Engine support for `constraint`, `required` validation
- 5aa7ebc: Support for notes
  - Display Notes fields on the UI
  - Show hint for the fields if defined in the Form

### Patch Changes

- 596c1fe: Add engine support for 'note' nodes
- 53d5f02: Added "Powered by ODK" caption at the bottom of the Form
- aa3a84a: Fix: evaluate `jr:count` in context of affected repeat

## 0.2.0

### Minor Changes

- 721506a: Added support for following `select_one` and `select_multiple` appearances (#141):
  - minimal
  - search
  - columns-pack
  - columns
  - columns-n
  - no-buttons
  - likert (`select_one` only)
  - label
  - list-nolabel
  - list

  Added support for `field-list` appearance for `group`.

### Patch Changes

- bab3924: Responsive layout: Adjust Form header based on screen size (#128)
- e7bef0c: Add initial engine support for appearances
- 8ab9493: fix: include css in the built js file, test build to prevent repeat regressions

## 0.1.1

### Patch Changes

- aa0e214: Update to latest stable Node versions: 18.20.3, 20.13.1, 22.2.0
- 53ab191: Include styles in bundle
- a26788b: Updated external dependencies
- e0f26e6: Fix: Vue is a peer dependency, all others are bundled
- 7a1f410: Downgrade Vue to 3.3.4 to match the version currently pinned in Central
