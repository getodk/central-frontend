import type { Temporal } from '@js-temporal/polyfill';
import type { Evaluator } from '../evaluator/Evaluator.ts';
import type { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import type { ContextDocument, ContextNode, ContextParentNode } from '../lib/dom/types.ts';
import type { XPathNamespaceResolverObject } from '../shared/interface.ts';

/**
 * The context in which any XPath expression *or sub-expression* is evaluated.
 */
export interface Context {
	// The evaluator itself acts as the containing context, and will provide
	// several aspects of the context's own environment.
	readonly evaluator: Evaluator;

	/**
	 * The `contextNode` as specified at the {@link Evaluator.evaluate} call site.
	 * This value is to remain constant for the entire scope of an evaluation.
	 *
	 * This explicitly supports the `current()` function, but it may also support
	 * a variety of other use cases and optimizations in the future.
	 */
	readonly evaluationContextNode: ContextNode;

	readonly contextDocument: ContextDocument;
	readonly rootNode: ContextParentNode;
	readonly contextNodes: Iterable<ContextNode>;

	contextPosition(): number;
	contextSize(): number;

	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: XPathNamespaceResolverObject;
	readonly timeZone: Temporal.TimeZone;
}
