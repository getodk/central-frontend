# @getodk/scenario

## 0.9.0

### Minor Changes

- d210211: Added support for markdown formatting in labels, hints, and constraints

### Patch Changes

- 36b977f: Support select one from map
- daef669: Throw an error when jr:choice_name is called with a reference that does not exist

## 0.8.0

### Minor Changes

- 05db2e6: Added support for jr:choice-name function
- a2d3912: Support references to form fields in translated form text

### Patch Changes

- 9860299: Resolved test unreliability by ensuring the size param is always valid

## 0.7.0

### Minor Changes

- 6b3e6c0: Dropped support for Node.js version 18.
  - Added support for Node.js version 24.
  - Upgraded Vite to version 7, along with Vitest and other libraries that support Node.js versions greater than 20.

### Patch Changes

- 8a56391: Upgrade dependencies to latest minor versions

## 0.6.4

### Patch Changes

- f8000cf: Fixes an issue where a submission with an XML declaration causes a crash during edits.

## 0.6.3

### Patch Changes

- f0e2745: Adds support for downloading image attachments referenced in a form's IText

## 0.6.2

### Patch Changes

- c44bc24: Adds error message descriptions.
- ab3be86: Support for date questions with no appearance and support for date notes.

## 0.6.1

### Patch Changes

- fd88153: Updates versions of dependencies
- e91e403: Updates versions of major dependencies

## 0.6.0

### Minor Changes

- 81a57c3: Support for rank question types (`<odk:rank>`)
- 99295eb: Support for geopoint questions with no appearance
  - Support for geopoint notes

### Patch Changes

- 0287a16: Fix: include namespace declarations in submission XML
- a08e77b: Fix: include primary instance root attributes in submission XML
- e6d01b0: Partial support for `<range>` (basic horizontal and vertical sliders)
  - **FIX** setting `<select1>` values with spaces
  - **BREAKING CHANGE** (`@getodk/xforms-engine`): `SelectNode`'s write methods have been replaced with more ergonomic alternatives

## 0.5.0

### Minor Changes

- 2fddcec: Support for external secondary instances (XML, CSV, GeoJSON)
- 8edf375: Initial engine support for preparing submissions

### Patch Changes

- e636a9c: XPath support for evaluation of arbitrary DOM implementations (XPathDOMAdapter)

## 0.4.0

### Minor Changes

- 6fb1054: Engine support for `<trigger>`

### Patch Changes

- c3b7165: - Fix: unsupported controls treated as `ModelValueNode`
  - Stub unsupported control nodes: `range`, `odk:rank`, `upload`

## 0.3.0

### Minor Changes

- 596c1fe: Add engine support for 'note' nodes
- 0c1534d: - Support tracking `current()` references in computations
  - Support tracking references in computations where path references include predicates
  - Improve support for repeat-based itemsets
  - Improve relative path resolution across the board, fixing many computation update edge cases where expressions include complex path expressions
  - Support relative `ref`/`nodeset` body attributes, as well as those with a `current()/` prefix
  - Improve function call analysis in XPath expressions, particularly identification of functions called with no arguments
  - Lay more mature foundation for general syntax analysis of XPath expressions
- 746aa8a: Support for `indexed-repeat` XPath function
- 7b63159: Add support for count-controlled (`jr:count`) and fixed (`jr:noAddRemove`) repeat ranges.
- 573b06b: Engine support for `constraint`, `required` validation

### Patch Changes

- aa3a84a: Fix: evaluate `jr:count` in context of affected repeat

## 0.2.0

### Minor Changes

- e7bef0c: Add initial engine support for appearances

### Patch Changes

- 7859da4: Several repeat-related fixes:
  - Fix: most cases of inconsistent children state in Solid-based clients
  - Fix: many cases of incomplete functionality on/within N > 1 repeat instances
  - Fix: computation of bind states (`relevant` especially) before values, properly clear non-relevant default values
  - Fix: timing inconsistency of some computations on init, adding repeat instances
  - Fix: application of `relevant` state where expression is on repeat itself

## 0.1.1

### Patch Changes

- aa0e214: Update to latest stable Node versions: 18.20.3, 20.13.1, 22.2.0
- a26788b: Updated external dependencies
