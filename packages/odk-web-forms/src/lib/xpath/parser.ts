import { ExpressionParser } from '@odk/xpath/static/grammar/ExpressionParser.js';
import xpathLanguage from 'tree-sitter-xpath/tree-sitter-xpath.wasm?url';
import webTreeSitter from 'web-tree-sitter/tree-sitter.wasm?url';

export const xpathParser = await ExpressionParser.init({
	webTreeSitter,
	xpathLanguage,
});
