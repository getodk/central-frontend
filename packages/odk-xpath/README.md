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

To use `@odk/xpath` at runtime, first create an `XFormsXPathEvaluator` instance, specifying a parser instance and the XForm `rootNode`. Usage from that point is API-compatible with the standard DOM [`evaluate` method](https://developer.mozilla.org/en-US/docs/Web/API/XPathEvaluator/evaluate).

```ts
import { XFormsXPathEvaluator } from '@odk/xpath';

// Given an XForms DOM document...
declare const xform: XMLDocument;

const evaluator = new XFormsXPathEvaluator(xpathParser, { rootNode: xform });

// A namespace resolver is optional, and the context node can be used (which is the default)
const nsResolver: XPathNSResolver = xform;

const result: XPathResult = evaluator.evaluate(
  '/root/...',
  xform,
  nsResolver,
  XPathResult.ORDERED_NODE_ITERATOR_TYPE
);
```

For typical XForms usage, `rootNode` will be either an XForm `XMLDocument` or its primary instance `Element`.

For XPath 1.0 functionality without XForms extension functions, you may use `Evaluator` the same way, and `rootNode` is optional:

```ts
import { Evaluator } from '@odk/xpath';

const evaluator = new Evaluator(xpathParser);

// ...
```

In either case, the `result` returned by `evaluate` is API-compatible with the standard DOM [`XPathResult`](https://developer.mozilla.org/en-US/docs/Web/API/XPathResult).

### Convenience APIs

Both evaluator classes provide the following convenience methods:

- `evaluateBoolean(expression: string, options?: { contextNode?: Node }): boolean`
- `evaluateNumber(expression: string, options?: { contextNode?: Node }): number`
- `evaluateString(expression: string, options?: { contextNode?: Node }): string`
- `evaluateNode(expression: string, options?: { contextNode?: Node }): Node | null`
- `evaluateNodes(expression: string, options?: { contextNode?: Node }): Node[]`

(Also provided: `evaluateElement` and `evaluateNonNullElement`, but these are not type safe so use them at your own risk.)

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

### ODK XForms

We intend to support the full ODK XForms function library, but support is currently incomplete. The following functions are not yet supported (the `jr:` prefix is used by convention to refer to the JavaRosa namespace):

- `indexed-repeat`
- `instance`
- `pulldata`
- `jr:choice-name`
- `jr:itext`

### Non-browser environments

The DOM standard is very complex, and compatibility libraries sometimes differ in terms of standards compliance and compatibility with the major browser implementations. It is likely, perhaps inevitable, that there will be edge cases and minor compatiblity issues when using such a library. At time of writing, no such issues are known in our tested environments, but a couple of minor issues have already been found and fixed during the initial test setup.
