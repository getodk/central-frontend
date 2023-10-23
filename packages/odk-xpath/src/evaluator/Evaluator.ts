import { Temporal } from '@js-temporal/polyfill';
import type { EvaluationContextOptions } from '../context/EvaluationContext.ts';
import { EvaluationContext } from '../context/EvaluationContext.ts';
import { fn } from '../functions/index.ts';
import type { AnyParentNode, ContextNode } from '../lib/dom/types.ts';
import type {
	AnyXPathEvaluator,
	XPathNSResolver,
	XPathNamespaceResolverObject,
	XPathResultType,
} from '../shared/index.ts';
import type { ParseOptions } from '../static/grammar/ExpressionParser.ts';
import { ExpressionParser } from '../static/grammar/ExpressionParser.ts';
import type { TreeSitterXPathParser } from '../static/grammar/TreeSitterXPathParser.ts';
import { createExpression } from './expression/factory.ts';
import { FunctionLibrary } from './functions/FunctionLibrary.ts';
import { ResultTypes } from './result/ResultType.ts';
import { toXPathResult } from './result/index.ts';

interface EvaluatorOptions {
	readonly functionLibrary?: FunctionLibrary;
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

export class Evaluator implements AnyXPathEvaluator {
	// TODO: see notes on cache in `ExpressionParser.ts`, update or remove those
	// if this usage changes in a way that addresses concerns expressed there.
	protected readonly parser: ExpressionParser;

	readonly functionLibrary: FunctionLibrary;
	readonly parseOptions: ParseOptions;
	readonly resultTypes: ResultTypes = ResultTypes;
	readonly sharedContextOptions: Partial<EvaluationContextOptions>;
	readonly timeZone: Temporal.TimeZone;

	constructor(xpathParser: TreeSitterXPathParser, options: EvaluatorOptions = {}) {
		const { functionLibrary = fn, parseOptions = {}, rootNode, timeZoneId } = options;

		this.functionLibrary = functionLibrary;
		this.parseOptions = parseOptions;
		this.parser = new ExpressionParser(xpathParser);
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
}
