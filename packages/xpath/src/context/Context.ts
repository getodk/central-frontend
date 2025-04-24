import type { Temporal } from 'temporal-polyfill';
import type { XPathNode } from '../adapter/interface/XPathDOMAdapter.ts';
import type {
	AdapterDocument,
	AdapterParentNode,
} from '../adapter/interface/XPathNodeKindAdapter.ts';
import type { XPathDOMProvider } from '../adapter/xpathDOMProvider.ts';
import type { Evaluator } from '../evaluator/Evaluator.ts';
import type { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import type { NamespaceResolver } from '../evaluator/NamespaceResolver.ts';

/**
 * The context in which any XPath expression *or sub-expression* is evaluated.
 */
export interface Context<T extends XPathNode> {
	// The evaluator itself acts as the containing context, and will provide
	// several aspects of the context's own environment.
	readonly evaluator: Evaluator<T>;

	readonly domProvider: XPathDOMProvider<T>;

	/**
	 * The `contextNode` as specified at the {@link Evaluator.evaluate} call site.
	 * This value is to remain constant for the entire scope of an evaluation.
	 *
	 * This explicitly supports the `current()` function, but it may also support
	 * a variety of other use cases and optimizations in the future.
	 */
	readonly evaluationContextNode: T;

	readonly contextDocument: AdapterDocument<T>;
	readonly rootNode: AdapterParentNode<T>;
	readonly contextNodes: Iterable<T>;

	contextPosition(): number;
	contextSize(): number;

	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: NamespaceResolver<T>;
	readonly timeZone: Temporal.TimeZoneLike;
}
