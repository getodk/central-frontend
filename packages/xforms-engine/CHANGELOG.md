# @getodk/xforms-engine

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
