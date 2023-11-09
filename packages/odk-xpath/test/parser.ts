import xpathLanguage from 'tree-sitter-xpath/tree-sitter-xpath.wasm?url';
import webTreeSitter from 'web-tree-sitter/tree-sitter.wasm?url';
import { TreeSitterXPathParser } from '../src/static/grammar/TreeSitterXPathParser.ts';

// Initialize a tree-sitter parser instance, with the tree-sitter-xpath language
// loaded. This is used in the test environment, and roughly serves as a
// reference implementation for how a similarly configured project will need to
// be initialized downstream.
export const xpathParser = await TreeSitterXPathParser.init({
	webTreeSitter,
	xpathLanguage,
});
