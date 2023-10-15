import { Temporal } from '@js-temporal/polyfill';
import type {
	CustomFunctionDefinition,
	XPathEvaluator,
	XPathNSResolver,
	XPathResultType,
} from '../shared/index.ts';
import type { EvaluationContextOptions } from '../context/EvaluationContext.ts';
import { EvaluationContext } from '../context/EvaluationContext.ts';
import { fn } from '../functions/index.ts';
import type { ContextNode } from '../lib/dom/types.ts';
import { ExpressionParser } from '../static/grammar/ExpressionParser.ts';
import { createExpression } from './expression/Expression.ts';
import { FunctionLibrary } from './functions/FunctionLibrary.ts';
import { ResultTypes } from './result/ResultType.ts';
import { toXPathResult } from './result/index.ts';

// TODO: see notes on cache in `ExpressionParser.ts`, update or remove those
// if this usage changes in a way that addresses concerns expressed there.
const parser = new ExpressionParser();

// export interface Evaluator {
//   readonly constructor: typeof Evaluator;
// }

interface EvaluatorOptions {
	readonly functionLibrary?: FunctionLibrary;
	readonly timeZoneId?: string | undefined;
}

export class Evaluator implements XPathEvaluator {
	readonly functionLibrary: FunctionLibrary;
	readonly resultTypes: ResultTypes = ResultTypes;
	readonly timeZone: Temporal.TimeZoneProtocol;

	constructor(options: EvaluatorOptions = {}) {
		this.functionLibrary = options.functionLibrary ?? fn;

		const timeZoneId = options.timeZoneId ?? Temporal.Now.timeZoneId();

		this.timeZone = Temporal.TimeZone.from(timeZoneId);
	}

	evaluate(
		expression: string,
		contextNode: Node,
		namespaceResolver: XPathNSResolver | null,
		resultType: XPathResultType | null
	) {
		const tree = parser.parse(expression);

		let contextOptions: Partial<EvaluationContextOptions> = {};

		if (typeof namespaceResolver === 'function') {
			contextOptions = {
				namespaceResolver: {
					lookupNamespaceURI: namespaceResolver,
				},
			};
		} else if (namespaceResolver != null) {
			contextOptions = {
				namespaceResolver,
			};
		}

		const expr = createExpression(tree.rootNode);
		const context = new EvaluationContext(this, contextNode as ContextNode, contextOptions);
		const results = expr.evaluate(context);

		return toXPathResult(resultType ?? XPathResult.ANY_TYPE, results);
	}

	readonly customXPathFunction = {
		add(name: string, _definition: CustomFunctionDefinition): void {
			throw new Error(`Failed to add function "${name}": custom functions not implemented`);
		},
	};
}
