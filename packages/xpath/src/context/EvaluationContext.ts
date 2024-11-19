import { Temporal } from '@js-temporal/polyfill';
import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type {
	AdapterDocument,
	AdapterParentNode,
} from '../adapter/interface/XPathNodeKindAdapter.ts';
import type { XPathDOMProvider } from '../adapter/xpathDOMProvider.ts';
import { LocationPathEvaluation } from '../evaluations/LocationPathEvaluation.ts';
import type { Evaluator } from '../evaluator/Evaluator.ts';
import { NamespaceResolver } from '../evaluator/NamespaceResolver.ts';
import type { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import type { Context } from './Context.ts';

export interface EvaluationContextOptions<T extends XPathNode> {
	readonly rootNode: AdapterParentNode<T> | null;
	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: XPathNSResolver | null;
	readonly timeZone: Temporal.TimeZone;
}

/**
 * The context in which an XPath expression (**not** a sub-expression)
 * is evaluated.
 */
export class EvaluationContext<T extends XPathNode> implements Context<T> {
	readonly domProvider: XPathDOMProvider<T>;

	/**
	 * @see {@link Context.evaluationContextNode}
	 */
	readonly evaluationContextNode: T;

	readonly contextDocument: AdapterDocument<T>;
	readonly rootNode: AdapterParentNode<T>;

	readonly contextNodes: Iterable<T>;

	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: NamespaceResolver<T>;

	readonly timeZone: Temporal.TimeZone;

	constructor(
		readonly evaluator: Evaluator<T>,
		contextNode: T,
		options: Partial<EvaluationContextOptions<T>> = {}
	) {
		const { domProvider } = evaluator;

		this.domProvider = domProvider;

		const { namespaceResolver } = options;

		const rootNode = options.rootNode ?? domProvider.getContainingDocument(contextNode);
		const contextDocument = domProvider.getContainingDocument(rootNode);

		this.contextDocument = contextDocument;
		this.evaluationContextNode = contextNode;
		this.contextNodes = [contextNode];
		this.rootNode = rootNode;
		this.functions = options.functions ?? evaluator.functions;
		this.namespaceResolver = NamespaceResolver.from(
			domProvider,
			contextDocument,
			contextDocument,
			namespaceResolver
		);
		this.timeZone = options.timeZone ?? evaluator.timeZone;
	}

	contextPosition(): number {
		return 1;
	}

	contextSize(): number {
		return 1;
	}

	currentContext<U extends XPathNode>(this: EvaluationContext<U>): LocationPathEvaluation<U> {
		return LocationPathEvaluation.fromCurrentContext(this);
	}

	rootContext<U extends XPathNode>(this: EvaluationContext<U>): LocationPathEvaluation<U> {
		return LocationPathEvaluation.fromRoot(this);
	}
}
