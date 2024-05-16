# @getodk/common (private package)

An internal package to address common (e.g. the dreaded "utils") concerns across two or more getodk/web-forms packages. There have already been several such cross-cutting concerns.

Candidates for this package should generally be at least one of:

- general purpose library code which is already in use across multiple packages, or has a high probability of being so in the near term
- low level support for shared problem domains between packages
- shared types which correspond to either of the above
- useful for shared internal purposes (config, testing, tooling, etc)

An effort will be made to keep these purposes clear in terms of categorization, module and export names, and so on. We'll try not to actually name something "utils".

Being an internal package, for now there is no build step: downstream packages should treat this as shared source code. **This is likely to change.** As usage becomes more concrete, we'll want to determine appropriate build steps, and update this README to expand documentation on topics like:

- downstream package setup concerns
- consideration for downstream build and bundle impact
- usage in a package intended for both internal and external purposes (i.e.
  packages such as `@getodk/tree-sitter-xpath` or `@getodk/xpath` which are used
  in `@getodk/xforms-engine` but may also be used on their own)
