import type { Temporal } from '@js-temporal/polyfill';
import type { XPathNamespaceResolverObject } from '../shared/interface.ts';
import type { Evaluator } from '../evaluator/Evaluator.ts';
import type { FunctionLibrary } from '../evaluator/functions/FunctionLibrary.ts';
import type { ContextDocument, ContextNode, ContextParentNode } from '../lib/dom/types.ts';

/**
 * The context in which any XPath expression *or sub-expression* is evaluated.
 */
export interface Context {
	// The evaluator itself acts as the containing context, and will provide
	// several aspects of the context's own environment.
	readonly evaluator: Evaluator;

	readonly contextDocument: ContextDocument;
	readonly rootNode: ContextParentNode;
	readonly contextNodes: Iterable<ContextNode>;

	contextPosition(): number;
	contextSize(): number;

	// TODO: namespaced function libraries? Could accommodate custom functions
	readonly functionLibrary: FunctionLibrary;
	readonly namespaceResolver: XPathNamespaceResolverObject;
	readonly timeZone: Temporal.TimeZone;
}
