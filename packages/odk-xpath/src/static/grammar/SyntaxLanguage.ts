import type { AnySyntaxType } from './type-names.ts';

export type SyntaxLanguageTypeName =
	// Named types produced by tree-sitter
	| AnySyntaxType
	// Unnamed types produced by tree-sitter
	| undefined;

export interface SyntaxLanguage {
	readonly types: readonly SyntaxLanguageTypeName[];
}
