# @getodk/web-forms

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
