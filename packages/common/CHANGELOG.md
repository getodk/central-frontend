# @getodk/common

## 0.7.0

### Minor Changes

- 6b3e6c0: Dropped support for Node.js version 18.
  - Added support for Node.js version 24.
  - Upgraded Vite to version 7, along with Vitest and other libraries that support Node.js versions greater than 20.

### Patch Changes

- 8a56391: Upgrade dependencies to latest minor versions

## 0.6.1

### Patch Changes

- f0e2745: Adds support for downloading image attachments referenced in a form's IText

## 0.6.0

### Minor Changes

- ab3be86: Support for date questions with no appearance and support for date notes.

## 0.5.2

### Patch Changes

- e91e403: Updates versions of major dependencies

## 0.5.1

### Patch Changes

- 81a57c3: Support for rank question types (`<odk:rank>`)
- e6d01b0: Partial support for `<range>` (basic horizontal and vertical sliders)
  - **FIX** setting `<select1>` values with spaces
  - **BREAKING CHANGE** (`@getodk/xforms-engine`): `SelectNode`'s write methods have been replaced with more ergonomic alternatives
- 99295eb: Support for geopoint questions with no appearance
  - Support for geopoint notes

## 0.5.0

### Minor Changes

- 2fddcec: Support for external secondary instances (XML, CSV, GeoJSON)

### Patch Changes

- e636a9c: XPath support for evaluation of arbitrary DOM implementations (XPathDOMAdapter)
- 8edf375: Initial engine support for preparing submissions

## 0.4.0

### Minor Changes

- 27c440d: Basic presentation of form load failures

## 0.3.0

### Minor Changes

- 7b63159: Add support for count-controlled (`jr:count`) and fixed (`jr:noAddRemove`) repeat ranges.
- 573b06b: Engine support for `constraint`, `required` validation

## 0.2.0

### Minor Changes

- e7bef0c: Support for `appearances`:
  - Added `PartiallyKnownString` type.
  - Several custom assertion helpers.

## 0.1.1

### Patch Changes

- aa0e214: Update to latest stable Node versions: 18.20.3, 20.13.1, 22.2.0
- a26788b: Updated external dependencies
