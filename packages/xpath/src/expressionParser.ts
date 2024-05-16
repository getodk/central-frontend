import xpathLanguage from '@getodk/tree-sitter-xpath/tree-sitter-xpath.wasm?url';
import webTreeSitter from 'web-tree-sitter/tree-sitter.wasm?url';
import { ExpressionParser } from './static/grammar/ExpressionParser.ts';

// TODO: this is built as a separate entrypoint for downstream use in static
// analysis. We likely should document its usage in the README.
export const expressionParser = await ExpressionParser.init({
	webTreeSitter,
	xpathLanguage,
});
