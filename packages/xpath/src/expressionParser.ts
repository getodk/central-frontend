/**
 * @module @getodk/xpath/expressionParser.js
 *
 * Currently a secondary entrypoint, for downstream access to a shared instance
 * of a single {@link ExpressionParser}.
 *
 * @todo Consolidate with other entrypoints, to be broken out of
 * {@link ODKXPathMainEntrypoint}.
 */

import type * as ODKXPathMainEntrypoint from './index.ts';

/**
 * - - -
 */

import xpathLanguage from '@getodk/tree-sitter-xpath/dist/tree-sitter-xpath.wasm?url';
import webTreeSitter from 'web-tree-sitter/tree-sitter.wasm?url';
import { ExpressionParser } from './static/grammar/ExpressionParser.ts';

// TODO: this is built as a separate entrypoint for downstream use in static
// analysis. We likely should document its usage in the README.
export const expressionParser = await ExpressionParser.init({
	webTreeSitter,
	xpathLanguage,
});
