import { Temporal } from '@js-temporal/polyfill';
import type { EvaluationContextOptions } from '../context/EvaluationContext.ts';
import { EvaluationContext } from '../context/EvaluationContext.ts';
import { expressionParser } from '../expressionParser.ts';
import { fn } from '../functions/fn/index.ts';
import type { AnyParentNode, ContextNode } from '../lib/dom/types.ts';
import type {
	AnyXPathEvaluator,
	XPathNSResolver,
	XPathNamespaceResolverObject,
	XPathResultType,
} from '../shared/index.ts';
import type { ExpressionParser, ParseOptions } from '../static/grammar/ExpressionParser.ts';
import { createExpression } from './expression/factory.ts';
import { FunctionLibraryCollection } from './functions/FunctionLibraryCollection.ts';
import { ResultTypes } from './result/ResultType.ts';
import { toXPathResult } from './result/index.ts';

const functions = new FunctionLibraryCollection([fn]);

export interface EvaluatorOptions {
	readonly functions?: FunctionLibraryCollection;
	readonly parseOptions?: ParseOptions;
	readonly rootNode?: AnyParentNode | null | undefined;
	readonly timeZoneId?: string | undefined;
}

type MaybeNullishEntry<T> = readonly [key: string, value: T | null | undefined];
type NonNullishEntry<T> = readonly [key: string, value: T];

const isNonNullEntry = <T>(entry: MaybeNullishEntry<T>): entry is NonNullishEntry<T> =>
	entry[1] != null;

type PartialOmitNullish<T> = {
	[K in keyof T]?: Exclude<T[K], null | undefined>;
};

const partialOmitNullish = <T extends Record<PropertyKey, unknown>>(
	object: T
): PartialOmitNullish<T> =>
	Object.fromEntries(Object.entries(object).filter(isNonNullEntry)) as PartialOmitNullish<T>;

export interface EvaluatorConvenienceMethodOptions {
	readonly contextNode?: Node;
}

export interface EvaluatorNodeConvenienceMethodOptions<AssertExists extends boolean = false>
	extends EvaluatorConvenienceMethodOptions {
	readonly assertExists?: AssertExists;
}

type EvaluatedNode<AssertExists extends boolean, T extends Node> = AssertExists extends true
	? T
	: T | null;

export class Evaluator implements AnyXPathEvaluator {
	// TODO: see notes on cache in `ExpressionParser.ts`, update or remove those
	// if this usage changes in a way that addresses concerns expressed there.
	protected readonly parser: ExpressionParser;

	readonly functions: FunctionLibraryCollection;
	readonly parseOptions: ParseOptions;
	readonly resultTypes: ResultTypes = ResultTypes;
	readonly rootNodeDocument: Document | XMLDocument | null = null;
	readonly rootNode: AnyParentNode | null;
	readonly sharedContextOptions: Partial<EvaluationContextOptions>;
	readonly timeZone: Temporal.TimeZone;

	constructor(options: EvaluatorOptions = {}) {
		const { parseOptions = {}, rootNode, timeZoneId } = options;

		this.functions = options.functions ?? functions;
		this.parseOptions = parseOptions;
		this.parser = expressionParser;
		this.rootNode = rootNode ?? null;

		if (rootNode != null) {
			this.rootNodeDocument = rootNode.ownerDocument ?? rootNode;
		}

		this.sharedContextOptions = partialOmitNullish({
			rootNode,
		});
		this.timeZone = new Temporal.TimeZone(timeZoneId ?? Temporal.Now.timeZoneId());
	}

	evaluate(
		expression: string,
		contextNode: Node,
		namespaceResolver: XPathNSResolver | null,
		resultType: XPathResultType | null
	) {
		const tree = this.parser.parse(expression, this.parseOptions);

		const evaluationContextNamespaceResolver: XPathNamespaceResolverObject | null =
			typeof namespaceResolver === 'function'
				? {
						lookupNamespaceURI: namespaceResolver,
					}
				: namespaceResolver;

		const contextOptions = partialOmitNullish({
			...this.sharedContextOptions,
			namespaceResolver: evaluationContextNamespaceResolver,
		});

		const expr = createExpression(tree.rootNode);
		const context = new EvaluationContext(this, contextNode as ContextNode, contextOptions);
		const results = expr.evaluate(context);

		return toXPathResult(resultType ?? XPathResult.ANY_TYPE, results);
	}

	protected getContextNode(options: EvaluatorConvenienceMethodOptions): Node {
		const contextNode = options.contextNode ?? this.rootNode;

		if (contextNode == null) {
			throw new Error(
				'Context node must be provided in options or as Evaluator constructor options.rootNode'
			);
		}

		return contextNode;
	}

	evaluateBoolean(expression: string, options: EvaluatorConvenienceMethodOptions = {}): boolean {
		const contextNode = this.getContextNode(options);

		return this.evaluate(expression, contextNode, null, XPathResult.BOOLEAN_TYPE).booleanValue;
	}

	evaluateNumber(expression: string, options: EvaluatorConvenienceMethodOptions = {}): number {
		const contextNode = this.getContextNode(options);

		return this.evaluate(expression, contextNode, null, XPathResult.NUMBER_TYPE).numberValue;
	}

	evaluateString(expression: string, options: EvaluatorConvenienceMethodOptions = {}): string {
		const contextNode = this.getContextNode(options);

		return this.evaluate(expression, contextNode, null, XPathResult.STRING_TYPE).stringValue;
	}

	evaluateNode<T extends Node, AssertExists extends boolean = false>(
		expression: string,
		options: EvaluatorNodeConvenienceMethodOptions<AssertExists> = {}
	): EvaluatedNode<AssertExists, T> {
		const contextNode = this.getContextNode(options);

		// TODO: unsafe cast
		const node = this.evaluate(expression, contextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE)
			.singleNodeValue as T | null;

		if (!options.assertExists) {
			return node as EvaluatedNode<AssertExists, T>;
		}

		if (node == null) {
			throw new Error(`Failed to evaluate node for expression ${expression}`);
		}

		return node as EvaluatedNode<AssertExists, T>;
	}

	evaluateElement<AssertExists extends boolean = false>(
		expression: string,
		options: EvaluatorNodeConvenienceMethodOptions<AssertExists> = {}
	) {
		return this.evaluateNode<Element, AssertExists>(expression, options);
	}

	evaluateNonNullElement(
		expression: string,
		options: Omit<EvaluatorNodeConvenienceMethodOptions<true>, 'assertExists'> = {}
	): Element {
		return this.evaluateElement<true>(expression, {
			...options,
			assertExists: true,
		});
	}

	evaluateNodes<T extends Node>(
		expression: string,
		options: EvaluatorNodeConvenienceMethodOptions = {}
	): T[] {
		const contextNode = this.getContextNode(options);

		const snapshotResult = this.evaluate(
			expression,
			contextNode,
			null,
			XPathResult.ORDERED_NODE_SNAPSHOT_TYPE
		);
		const { snapshotLength } = snapshotResult;
		const nodes: T[] = [];

		for (let i = 0; i < snapshotLength; i += 1) {
			nodes.push(
				// TODO: unsafe cast
				snapshotResult.snapshotItem(i) as T
			);
		}

		return nodes;
	}
}
