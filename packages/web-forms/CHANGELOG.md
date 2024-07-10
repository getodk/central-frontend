# @getodk/web-forms

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
