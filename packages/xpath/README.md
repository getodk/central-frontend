# @getodk/xpath

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
npm install @getodk/tree-sitter-xpath @getodk/xpath web-tree-sitter
```

## Usage

To use `@getodk/xpath` at runtime, first create an `XFormsXPathEvaluator`
instance, specifying the XForm `rootNode`. Usage from that point is
API-compatible with the standard DOM [`evaluate`
method](https://developer.mozilla.org/en-US/docs/Web/API/XPathEvaluator/evaluate).

```ts
import { XFormsXPathEvaluator } from '@getodk/xpath';

// Given an XForms DOM document...
declare const xform: XMLDocument;

const evaluator = new XFormsXPathEvaluator({ rootNode: xform });

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
import { Evaluator } from '@getodk/xpath';

const evaluator = new Evaluator();

// ...
```

In either case, the `result` returned by `evaluate` is API-compatible with the standard DOM [`XPathResult`](https://developer.mozilla.org/en-US/docs/Web/API/XPathResult).

### XForms `itext` translations

`XFormsXPathEvaluator` supports the JavaRosa `itext` function (`jr:itext` by convention), as specified in ODK XForms, which says:

> Obtains an itext value for the provided reference in the active language from the `<itext>` block in the model.

This active language state is managed at the `XFormXPathEvaluator` instance level, with the default language (again as specified in ODK XForms) active on construction. You can access a form's available languages, and get or set the active language under the `XFormXPathEvaluator.translations` object.

Example:

```ts
const domParser = new DOMParser();
const xform: XMLDocument = domParser.parseFromString(
  `<h:html>
  <h:head>
    <model>
      <itext>
        <translation lang="English" default="true()">
          <text id="hello">
            <value>hello</value>
          </text>
        </translation>
        <translation lang="Español">
          <text id="hello">
            <value>hola</value>
          </text>
        </translation>
      </itext>
    </model>
  </h:head>
  <!-- ... -->
</h:html>`,
  'text/xml'
);
const evaluator = new XFormsXPathEvaluator({ rootNode: xform });

evaluator.translations.getLanguages(); // ['English', 'Español']
evaluator.translations.getActiveLanguage(); // 'English'
evaluator.evaluate('jr:itext("hello")', xform, null, XPathResult.STRING_TYPE).stringValue; // 'hello'

evaluator.translations.setActiveLanguage('Español'); // 'Español'
evaluator.translations.getActiveLanguage(); // 'Español'
evaluator.evaluate('jr:itext("hello")', xform, null, XPathResult.STRING_TYPE).stringValue; // 'hola'
```

There are currently a few caveats to `jr:itext` use:

- `<itext>` and its translations are evaluated from the **document root** of the `rootNode` specified in `XFormsXPathEvaluator` options. As such:

  - translations _will_ be resolved if a descendant `rootNode` (e.g. the XForm's primary `<instance>` element) is specified

  - translations _will not_ be resolved for an XForm in an unusual DOM structure (e.g. a `DocumentFragment`, or in an arbitrary subtree of an unrelated document)

- Translations are treated as static, and cached during construction of `XFormsXPathEvaluator`. This is based on typical usage, wherein an XForm definition itself is expected to be static, but it will not (yet) support use cases like authoring an XForm definition.

- `<value form="...anything...">` is not yet supported. It's unclear what the interface for this usage might be.

- The interface for getting and setting language state is currently experimental pending integration experience, and may be changed in the future. The intent of this interface is to be relatively agnostic to outside state management, and to isolate this sort of stateful context from the XForm DOM, but that approach may also change.

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
- `pulldata`
- `jr:choice-name`

### Non-browser environments

The DOM standard is very complex, and compatibility libraries sometimes differ in terms of standards compliance and compatibility with the major browser implementations. It is likely, perhaps inevitable, that there will be edge cases and minor compatiblity issues when using such a library. At time of writing, no such issues are known in our tested environments, but a couple of minor issues have already been found and fixed during the initial test setup.
