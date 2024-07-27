import { Temporal } from '@js-temporal/polyfill';
import { LocationPathEvaluation } from '../evaluations/LocationPathEvaluation.ts';
import type { Evaluator } from '../evaluator/Evaluator.ts';
import { NamespaceResolver } from '../evaluator/NamespaceResolver.ts';
import type { FunctionLibraryCollection } from '../evaluator/functions/FunctionLibraryCollection.ts';
import { getDocument, getRootNode } from '../lib/dom/traversal.ts';
import type { ContextDocument, ContextNode, ContextParentNode } from '../lib/dom/types.ts';
import type { XPathNamespaceResolverObject } from '../shared/interface.ts';
import type { Context } from './Context.ts';

export interface EvaluationContextOptions {
	readonly document: ContextDocument;
	readonly rootNode: ContextParentNode;
	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: XPathNamespaceResolverObject;
	readonly timeZone: Temporal.TimeZone;
}

/**
 * The context in which an XPath expression (**not** a sub-expression)
 * is evaluated.
 */
export class EvaluationContext implements Context {
	/**
	 * @see {@link Context.evaluationContextNode}
	 */
	readonly evaluationContextNode: ContextNode;

	readonly contextDocument: ContextDocument;
	readonly rootNode: ContextParentNode;

	readonly contextNodes: Iterable<ContextNode>;

	readonly functions: FunctionLibraryCollection;
	readonly namespaceResolver: XPathNamespaceResolverObject;

	readonly timeZone: Temporal.TimeZone;

	constructor(
		readonly evaluator: Evaluator,
		contextNode: ContextNode,
		options: Partial<EvaluationContextOptions> = {}
	) {
		const {
			rootNode = getRootNode(contextNode),
			document = getDocument(rootNode),
			functions = evaluator.functions,
			namespaceResolver = new NamespaceResolver(document, contextNode),
			timeZone = evaluator.timeZone,
		} = options;

		this.contextDocument = document;
		this.evaluationContextNode = contextNode;
		this.contextNodes = [contextNode];
		this.rootNode = rootNode;
		this.functions = functions;
		this.namespaceResolver = namespaceResolver;
		this.timeZone = timeZone;
	}

	contextPosition(): number {
		return 1;
	}

	contextSize(): number {
		return 1;
	}

	currentContext(): LocationPathEvaluation {
		return LocationPathEvaluation.fromCurrentContext(this);
	}

	rootContext(): LocationPathEvaluation {
		return LocationPathEvaluation.fromRoot(this);
	}
}
