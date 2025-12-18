import { Temporal } from 'temporal-polyfill';
import type { UnwrapAdapterNode } from '../adapter/interface/XPathCustomUnwrappableNode.ts';
import type { XPathDOMAdapter } from '../adapter/interface/XPathDOMAdapter.ts';
import type { XPathNode } from '../adapter/interface/XPathNode.ts';
import type {
	AdapterElement,
	AdapterParentNode,
} from '../adapter/interface/XPathNodeKindAdapter.ts';
import type { XPathDOMProvider } from '../adapter/xpathDOMProvider.ts';
import { xpathDOMProvider } from '../adapter/xpathDOMProvider.ts';
import { EvaluationContext } from '../context/EvaluationContext.ts';
import { expressionParser } from '../expressionParser.ts';
import { fn } from '../functions/fn/index.ts';
import type { ExpressionParser, ParseOptions } from '../static/grammar/ExpressionParser.ts';
import { createExpression } from './expression/factory.ts';
import { FunctionLibraryCollection } from './functions/FunctionLibraryCollection.ts';
import { clearCache as nrClearCache } from './NamespaceResolver.ts';
import { toXPathEvaluationResult } from './result/toXPathEvaluationResult.ts';
import {
	XPATH_EVALUATION_RESULT,
	type XPathEvaluationResult,
	type XPathEvaluationResultType,
} from './result/XPathEvaluationResult.ts';

const functions = new FunctionLibraryCollection([fn]);

// prettier-ignore
type EvaluatorRootNodeOption<T extends XPathNode> =
	| AdapterParentNode<T>
	| UnwrapAdapterNode<AdapterParentNode<T>>;

export interface EvaluatorOptions<T extends XPathNode> {
	readonly domAdapter: XPathDOMAdapter<T>;
	readonly functions?: FunctionLibraryCollection;
	readonly parseOptions?: ParseOptions;
	readonly rootNode?: EvaluatorRootNodeOption<T> | null | undefined;
	readonly timeZoneId?: string | undefined;
}

export interface EvaluatorConvenienceMethodOptions<T extends XPathNode> {
	readonly contextNode?: T | UnwrapAdapterNode<T>;
}

export interface EvaluatorNodeConvenienceMethodOptions<
	T extends XPathNode,
	AssertExists extends boolean = false,
> extends EvaluatorConvenienceMethodOptions<T> {
	readonly assertExists?: AssertExists;
}

// prettier-ignore
type EvaluatedNode<
	T extends XPathNode,
	U extends T | UnwrapAdapterNode<T>,
	AssertExists extends boolean,
> =
		AssertExists extends true
			? U
			: U | null;

export const clearCache = () => {
	nrClearCache();
};

export class Evaluator<T extends XPathNode> {
	readonly domProvider: XPathDOMProvider<T>;

	// TODO: see notes on cache in `ExpressionParser.ts`, update or remove those
	// if this usage changes in a way that addresses concerns expressed there.
	protected readonly parser: ExpressionParser;

	readonly functions: FunctionLibraryCollection;
	readonly parseOptions: ParseOptions;
	readonly rootNode: AdapterParentNode<T> | null;
	readonly timeZone: Temporal.TimeZoneLike;

	constructor(options: EvaluatorOptions<T>) {
		// prettier-ignore
		const rootNode = (
			options.rootNode ??
			null
		) satisfies EvaluatorRootNodeOption<T> | null as AdapterParentNode<T> | null;

		const { domAdapter, parseOptions = {}, timeZoneId } = options;

		// If this explicit annotation looks weird, it's because TypeScript demands
		// explicit type annotations anywhere type assertions occur... apparently
		// even when the already-explicit method name... merely is a method...
		const domProvider: XPathDOMProvider<T> = xpathDOMProvider(domAdapter);

		if (rootNode != null) {
			domProvider.assertParentNode(rootNode, 'Invalid root node');
		}

		this.domProvider = domProvider;
		this.rootNode = rootNode;
		this.functions = options.functions ?? functions;
		this.parseOptions = parseOptions;
		this.parser = expressionParser;
		this.timeZone = timeZoneId ?? Temporal.Now.timeZoneId();
	}

	/**
	 * @package - exposed for testing
	 */
	getEvaluationContext(
		contextNode: T | UnwrapAdapterNode<T>,
		namespaceResolver: Extract<T, XPathNSResolver> | XPathNSResolver | null
	): EvaluationContext<T> {
		const contextOptions = {
			rootNode: this.rootNode,
			namespaceResolver,
		};

		this.domProvider.assertXPathNode(contextNode);

		return new EvaluationContext(this, contextNode, contextOptions);
	}

	evaluate(
		expression: string,
		contextNode: T | UnwrapAdapterNode<T>,
		namespaceResolver: XPathNSResolver | null,
		resultType: XPathEvaluationResultType | null
	): XPathEvaluationResult<T> {
		const tree = this.parser.parse(expression, this.parseOptions);
		const expr = createExpression(tree.rootNode);
		const evaluationContext = this.getEvaluationContext(contextNode, namespaceResolver);
		const results = expr.evaluate(evaluationContext);

		return toXPathEvaluationResult(
			this.domProvider,
			resultType ?? XPATH_EVALUATION_RESULT.ANY_TYPE,
			results
		);
	}

	protected getContextNode(options: EvaluatorConvenienceMethodOptions<T>): T {
		const contextNode = options.contextNode ?? this.rootNode;

		if (contextNode == null) {
			throw new Error(
				'Context node must be provided in options or as Evaluator constructor options.rootNode'
			);
		}

		return contextNode satisfies T | UnwrapAdapterNode<T> as T;
	}

	evaluateBoolean(expression: string, options: EvaluatorConvenienceMethodOptions<T> = {}): boolean {
		const contextNode = this.getContextNode(options);

		return this.evaluate(expression, contextNode, null, XPATH_EVALUATION_RESULT.BOOLEAN_TYPE)
			.booleanValue;
	}

	evaluateNumber(expression: string, options: EvaluatorConvenienceMethodOptions<T> = {}): number {
		const contextNode = this.getContextNode(options);

		return this.evaluate(expression, contextNode, null, XPATH_EVALUATION_RESULT.NUMBER_TYPE)
			.numberValue;
	}

	evaluateString(expression: string, options: EvaluatorConvenienceMethodOptions<T> = {}): string {
		const contextNode = this.getContextNode(options);

		return this.evaluate(expression, contextNode, null, XPATH_EVALUATION_RESULT.STRING_TYPE)
			.stringValue;
	}

	evaluateNode<U extends T | UnwrapAdapterNode<T> = T, AssertExists extends boolean = false>(
		expression: string,
		options: EvaluatorNodeConvenienceMethodOptions<T, AssertExists> = {}
	): EvaluatedNode<T, U, AssertExists> {
		const contextNode = this.getContextNode(options);

		// TODO: unsafe cast
		const node = this.evaluate(
			expression,
			contextNode,
			null,
			XPATH_EVALUATION_RESULT.FIRST_ORDERED_NODE_TYPE
		).singleNodeValue as U | null;

		if (!options.assertExists) {
			return node as EvaluatedNode<T, U, AssertExists>;
		}

		if (node == null) {
			throw new Error(`Failed to evaluate node for expression ${expression}`);
		}

		return node as EvaluatedNode<T, U, AssertExists>;
	}

	evaluateElement<
		U extends AdapterElement<T> | UnwrapAdapterNode<AdapterElement<T>> = AdapterElement<T>,
		AssertExists extends boolean = false,
	>(expression: string, options: EvaluatorNodeConvenienceMethodOptions<T, AssertExists> = {}) {
		return this.evaluateNode<U, AssertExists>(expression, options);
	}

	evaluateNonNullElement<
		U extends AdapterElement<T> | UnwrapAdapterNode<AdapterElement<T>> = AdapterElement<T>,
	>(
		expression: string,
		options: Omit<EvaluatorNodeConvenienceMethodOptions<T, true>, 'assertExists'> = {}
	): U {
		return this.evaluateElement<U, true>(expression, {
			...options,
			assertExists: true,
		});
	}

	evaluateNodes<U extends T | UnwrapAdapterNode<T>>(
		expression: string,
		options: EvaluatorNodeConvenienceMethodOptions<T> = {}
	): U[] {
		const contextNode = this.getContextNode(options);

		const snapshotResult = this.evaluate(
			expression,
			contextNode,
			null,
			XPATH_EVALUATION_RESULT.ORDERED_NODE_SNAPSHOT_TYPE
		);
		const { snapshotLength } = snapshotResult;
		const nodes: U[] = [];

		for (let i = 0; i < snapshotLength; i += 1) {
			nodes.push(
				// TODO: unsafe cast
				snapshotResult.snapshotItem(i) as U
			);
		}

		return nodes;
	}
}
