# @odk/xpath

An XPath evaluator, with intent to support:

- Full XPath 1.0 syntax and behavior
- Context-based extensibility of behavior beyond the XPath 1.0 function library
- [ODK XForms](https://getodk.github.io/xforms-spec/) XPath extensions
- Non-browser environments (provided a subset of standard DOM APIs)
- Minor accommodations for certain [Enketo](https://github.com/enketo/enketo/tree/main/packages/openrosa-xpath-evaluator) function aliases:
  - `date-time` is an alias of `date`, which is assumed to be additive
  - `format-date` function is an alias of `format-date-time`, which differs from the ODK XForms spec

## Install

Install this package and its required peer dependencies with `npm` (or the equivalent command for your preferred package manager):

```sh
npm install @odk/xpath web-tree-sitter tree-sitter-xpath
```

### A note on tree-sitter, usage with or without a bundler

The `@odk/xpath` package depends on the `web-tree-sitter` and `tree-sitter-xpath` libraries. Both provide WASM resources which must be accessible to initialize parsing in this libary. We intend to make setting it all up as easy as possible, and document it thoroughly. That effort is a work in progress, pending our own experience using this library internally. We'll update this space as that effort progresses.

A solution which is working so far, both in the @odk/xpath test suite and downstream within the odk-web-forms monorepo:

```ts
import xpathLanguage from 'tree-sitter-xpath/tree-sitter-xpath.wasm?url';
import webTreeSitter from 'web-tree-sitter/tree-sitter.wasm?url';
import { TreeSitterXPathParser } from '@odk/xpath/static/grammar/TreeSitterXPathParser.ts';

export const xpathParser = await TreeSitterXPathParser.init({
  webTreeSitter,
  xpathLanguage,
});
```

Note that this depends on Vite's [`?url` import suffix](https://vitejs.dev/guide/assets.html#explicit-url-imports). The same general approach should apply for other tooling/bundlers or even without a build step, so long as `webTreeSitter` and `xpathLanguage` successfully resolve to their respective WASM resources.

## Example usage

To use `@odk/xpath` at runtime, you first create an `Evaluator` instance. Usage from that point is API-compatible with the standard DOM [`evaluate` method](https://developer.mozilla.org/en-US/docs/Web/API/XPathEvaluator/evaluate).

```ts
import { Evaluator } from '@odk/xpath';

const evaluator = new Evaluator();

// Given some DOM document, e.g. ...
const parser = new DOMParser();
const doc = parser.parseFromString(
  `<root>
    <!-- ... --->
  </root>`,
  'text/xml'
);

// A namespace resolver is optional, and the context node can be used (which is the default)
const nsResolver: XPathNSResolver = doc;

const result: XPathResult = evaluator.evaluate(
  '/root/...',
  doc,
  nsResolver,
  XPathResult.ORDERED_NODE_ITERATOR_TYPE
);
```

Likewise, `result` is API-compatible with the standard DOM [`XPathResult`](https://developer.mozilla.org/en-US/docs/Web/API/XPathResult).

**Note on APIs:** we do not currently provide typical convience API extensions for e.g. common iteration tasks (although we may eventually). It is likely that the standard iterator API result types will perform better than their snapshot counterparts. It is also likely that unordered results may perform better than ordered, now or after future optimizations. Of course, caution should be used with unordered results in general.

## Supported/tested environments

- Browsers (latest versions):
  - Chrome/Chromium-based browsers (tested only in Chromium)
  - Firefox
  - Safari/WebKit (tested in WebKit directly)
- Non-browser runtimes with a DOM compatibility environement:
  - Node (current/LTS; tested with [jsdom](https://github.com/jsdom/jsdom)). Node DOM compatibility **does not** require any native extensions for. DOM compatibility **does not** require any underlying XPath evaluation functionality (though it does currently rely on global constants like `XPathResult`).
  - Other runtimes and DOM compatibility libraries are not currently tested, support is unknown.

## Known issues and incompatibilities

### XPath 1.0

- Expressions with variable references are parsed incorrectly. There is also no API to provide variable values, even if variable references were supported.
- ODK extensions are currently enabled by default, which introduces some differences in behavior around `dateTime` data types. It is possible to omit these extensions, restoring standard compliance for affected expressions. Documentation for this may be provided in the future as interest arises.

### ODK XForms

We intend to support the full ODK XForms function library, but support is currently incomplete. The following functions are not yet supported:

- `current`
- `indexed-repeat`
- `instance`
- `pulldata`
- `version`

### Non-browser environments

The DOM standard is very complex, and compatibility libraries sometimes differ in terms of standards compliance and compatibility with the major browser implementations. It is likely, perhaps inevitable, that there will be edge cases and minor compatiblity issues when using such a library. At time of writing, no such issues are known in our tested environments, but a couple of minor issues have already been found and fixed during the initial test setup.
