import xpathLanguage from '@odk-web-forms/tree-sitter-xpath/tree-sitter-xpath.wasm?url';
import { ExpressionParser } from '@odk-web-forms/xpath/static/grammar/ExpressionParser.js';
import webTreeSitter from 'web-tree-sitter/tree-sitter.wasm?url';

// TODO: passing these in is likely redundant now! It's also likely doubling the
// impact on final bundle size (in the engine, as well as in any client package)
export const xpathParser = await ExpressionParser.init({
	webTreeSitter,
	xpathLanguage,
});
