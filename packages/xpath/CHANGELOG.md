# @getodk/xpath

## 0.4.1

### Patch Changes

- fd88153: Updates versions of dependencies
- e91e403: Updates versions of major dependencies
- Updated dependencies [e91e403]
  - @getodk/common@0.5.2

## 0.4.0

### Minor Changes

- 8892010: The `xf:distance` function signature is now variadic, consistent with the revised signature specified by ODK XForms.

### Patch Changes

- 0700362: Choice list order randomization seed handling: better correspondence with JavaRosa behaviour,
  including the addition of derivation of seeds from non-numeric inputs.
  Previously, entering a non-integer in a form field seed input would result in an exception being thrown.
- 48cb3c9: Improved consistency with Collect/JavaRosa:

  - `area` and `distance` handle a trailing semicolon in serialized semicolon-separated `geopoint` lists
  - `distance` produces an error for invalid input
  - `area` returns `0` for invalid input

- Updated dependencies [81a57c3]
- Updated dependencies [e6d01b0]
- Updated dependencies [99295eb]
  - @getodk/common@0.5.1

## 0.3.0

### Minor Changes

- e636a9c: XPath support for evaluation of arbitrary DOM implementations (XPathDOMAdapter)

### Patch Changes

- Updated dependencies [2fddcec]
- Updated dependencies [e636a9c]
- Updated dependencies [8edf375]
  - @getodk/common@0.5.0

## 0.2.1

### Patch Changes

- Updated dependencies [27c440d]
  - @getodk/common@0.4.0

## 0.2.0

### Minor Changes

- 746aa8a: Support for `indexed-repeat` XPath function

### Patch Changes

- Updated dependencies [7b63159]
- Updated dependencies [573b06b]
  - @getodk/common@0.3.0

## 0.1.2

### Patch Changes

- Updated dependencies [4a87291]
  - @getodk/common@0.2.0

## 0.1.1

### Patch Changes

- aa0e214: Update to latest stable Node versions: 18.20.3, 20.13.1, 22.2.0
- a26788b: Updated external dependencies
- Updated dependencies [aa0e214]
- Updated dependencies [a26788b]
  - @getodk/common@0.1.1
