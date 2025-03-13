# @getodk/xforms-engine

## 0.6.0

### Minor Changes

- 4d97e54: Compute `jr:preload="uid"` on form initialization.
  - Ensure submission XML incluces `instanceID` metadata. If not present in form definition, defaults to computing `jr:preload="uid"`.
  - Support for use of non-default (XForms) namespaces by primary instance elements, including:
    - Production of form-defined namespace declarations in submission XML;
    - Preservation of form-defined namespace prefix;
    - Use of namespace prefix in bind nodeset;
    - Use of namespace prefix in computed expressions.
  - Support for use of non-default namespaces by internal secondary instances.
  - Partial support for use of non-default namespaces by external XML secondary instances. (Namespaces may be resolved to engine-internal defaults.)
- 8892010: The `xf:distance` XPath function now accepts multiple arguments. This makes it easier to compute the distance between multiple points within a form's primary instance. Previously, to achieve this, you'd have to introduce a `calculate` which concatenates those points together, then call the distance function with a reference to that `calculate` as the argument.
- 81a57c3: Support for rank question types (`<odk:rank>`)
- 99295eb: Support for geopoint questions with no appearance
  - Support for geopoint notes

### Patch Changes

- 0287a16: Fix: include namespace declarations in submission XML
- a08e77b: Fix: include primary instance root attributes in submission XML
- 2bf859e: Fix: relax parsing of `jr:preload` and `jr:preloadParams`. Any value for either attribute is accepted. Known (specified in ODK XForms, at time of writing) values are provided as type hints, similarly to how known appearances are specified.
- dac0d0b: Fix: correct types for chunked/monolithic submission result
- 00517c2: Fix: illegal invocation when fetching form xml

## 0.5.0

### Minor Changes

- fcda4d8: Support for decimal and int bind types (model values and inputs)
- 2fddcec: Support for external secondary instances (XML, CSV, GeoJSON)
- e636a9c: XPath support for evaluation of arbitrary DOM implementations (XPathDOMAdapter)
- 8edf375: Initial engine support for preparing submissions

## 0.4.0

### Minor Changes

- 6fb1054: Engine support for `<trigger>`

### Patch Changes

- c3b7165: - Fix: unsupported controls treated as `ModelValueNode`
  - Stub unsupported control nodes: `range`, `odk:rank`, `upload`
- 5f50bd3: Fixed the name of upload node for parsing the Form

## 0.3.0

### Minor Changes

- 596c1fe: Add engine support for 'note' nodes
- 0c1534d: Improve path resolution and updating computations
  - Support tracking `current()` references in computations
  - Support tracking references in computations where path references include predicates
  - Improve support for repeat-based itemsets
  - Improve relative path resolution across the board, fixing many computation update edge cases where expressions include complex path expressions
  - Support relative `ref`/`nodeset` body attributes, as well as those with a `current()/` prefix
  - Improve function call analysis in XPath expressions, particularly identification of functions called with no arguments
  - Lay more mature foundation for general syntax analysis of XPath expressions
- 7b63159: Add support for count-controlled (`jr:count`) and fixed (`jr:noAddRemove`) repeat ranges.
- 573b06b: Engine support for `constraint`, `required` validation

### Patch Changes

- e81aa43: Fix: reactive aggregation of validation violations from selects
- 1e72854: Fix: reactivity of aggregated validation violations on deep descendants
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
