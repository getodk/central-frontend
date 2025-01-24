import { SHA256 } from 'crypto-js';

import type { XPathNode } from '../../adapter/interface/XPathNode.ts';
import type { XPathDOMProvider } from '../../adapter/xpathDOMProvider.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { EvaluableArgument } from '../../evaluator/functions/FunctionImplementation.ts';
import { NodeSetFunction } from '../../evaluator/functions/NodeSetFunction.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { seededRandomize } from '../../lib/collections/sort.ts';
import { XFormsXPathEvaluator } from '../../xforms/XFormsXPathEvaluator.ts';

export const countNonEmpty = new NumberFunction(
	'count-non-empty',
	[{ arityType: 'required' }],
	(context, [expression]): number => {
		const results = expression!.evaluate(context);

		if (results.type !== 'NODE') {
			throw 'todo';
		}

		let result = 0;

		for (const self of results) {
			if (self.toString() !== '') {
				result += 1;
			}
		}

		return result;
	}
);

type AssertArgument = (index: number, arg?: EvaluableArgument) => asserts arg is EvaluableArgument;

const assertArgument: AssertArgument = (index, arg) => {
	if (arg == null) {
		throw new Error(`Argument ${index + 1} expected`);
	}
};

/**
 * Note: this function is not intended to be general outside of usage by
 * {@link indexedRepeat}.
 *
 * Evaluation of the provided argument is eager—i.e. materializing the complete
 * array of results, rather than the typical `Iterable<T>` produced in most
 * cases—because it is expected that in most cases the eagerness will not be
 * terribly expensive, and all results will usually be consumed, either to be
 * indexed or filtered in other ways applicable at call sites.
 *
 * Function is named to reflect that expectation.
 */
const evaluateArgumentToFilterableNodes = <T extends XPathNode>(
	context: LocationPathEvaluation<T>,
	arg: EvaluableArgument
): readonly T[] => {
	const evaluation = arg.evaluate(context);

	LocationPathEvaluation.assertInstance(context, evaluation);

	return Array.from(evaluation.contextNodes);
};

interface EvaluatedIndexedRepeatArgumentPair<T extends XPathNode> {
	readonly repeats: readonly T[];
	readonly position: number;
}

type DepthSortResult = -1 | 0 | 1;

/**
 * @todo This is **obviously cacheable**, but it would make most sense to cache
 * it at the expression level (or at the expression + bound context node level).
 * All of the expression analysis machinery is further up the stack (as it
 * generally ought to be with current designs), but it would be nice to consider
 * how we'd address caching with these kinds of dynamics at play.
 */
const compareContainmentDepth = <T extends XPathNode>(
	domProvider: XPathDOMProvider<T>,
	{ repeats: a }: EvaluatedIndexedRepeatArgumentPair<T>,
	{ repeats: b }: EvaluatedIndexedRepeatArgumentPair<T>
): DepthSortResult => {
	for (const repeatA of a) {
		for (const repeatB of b) {
			if (domProvider.isDescendantNode(repeatA, repeatB)) {
				return -1;
			}

			if (domProvider.isDescendantNode(repeatB, repeatA)) {
				return 1;
			}
		}
	}

	if (a.length === 0 || b.length === 0) {
		return 0;
	}

	// TODO: if we reach this point, there is no hierarchical relationship between
	// the repeats in `repeatN` and `repeatN + M`. This seems to violate **at
	// least the intent** of the spec. We should probably produce an error here?
	return 0;
};

export const indexedRepeat = new NodeSetFunction(
	'indexed-repeat',
	[
		// spec: arg
		{ arityType: 'required', typeHint: 'node' },
		// spec: repeat1
		{ arityType: 'required', typeHint: 'node' },
		// spec: index1
		{ arityType: 'required', typeHint: 'number' },
		// spec: repeatN=0 -> repeat2
		{ arityType: 'optional', typeHint: 'node' },
		// spec: indexN=0 -> index2
		{ arityType: 'optional', typeHint: 'number' },
		// spec: repeatN=1 -> repeat3
		{ arityType: 'optional', typeHint: 'node' },
		// spec: indexN=1 -> index3
		{ arityType: 'optional', typeHint: 'number' },

		// Go beyond spec? Why the heck not! It's clearly a variadic design.
		{ arityType: 'variadic', typeHint: 'any' },
	],
	<T extends XPathNode>(
		context: LocationPathEvaluation<T>,
		args: readonly EvaluableArgument[]
	): readonly T[] => {
		// First argument is `target` (per spec) of the deepest resolved repeat
		const target = args[0]!;

		let pairs: Array<EvaluatedIndexedRepeatArgumentPair<T>> = [];

		// Iterate through rest of arguments, collecting pairs of:
		//
		// - `repeats`: **all** nodes matching the supplied node-set for the
		//   `repeatN` argument in this pair
		// - `position`: the resolved number value for the `indexN` (per spec)
		//   argument at in this pair
		//
		// For **all `repeatN`/`indexN` pairs**, arguments are evaluated in the
		// calling context (in typical XForms usage, this will be the context of the
		// bound node). This is the core difference between this approach and the
		// original in https://github.com/getodk/web-forms/pull/150. That
		// understanding was clarified in review of that orignal effort, and is
		// borne out by new tests exercising depth > 1, which demonstrate the same
		// behavior in JavaRosa.
		//
		// Note: we start iterating here at index 1 so assertions related to
		// positional argument index are clear.
		for (let i = 1; i < args.length; i += 2) {
			const repeatsArg = args[i];
			const positionArg = args[i + 1];

			assertArgument(i, repeatsArg);
			assertArgument(i + 1, positionArg);

			// Evaluate position first, because...
			const position = positionArg.evaluate(context).toNumber();

			// ... if any "index" (position) is `NaN`, we short-circuit. This is
			// expected behavior because the equivalent `/data/repN[posN]/target`
			// expression would do the same.
			if (Number.isNaN(position)) {
				return [];
			}

			// Reiterating the point made describing this loop for future clarity:
			// this collects **all** of the nodes matching the `repeatN` expression.
			// We filter them in a later step.
			const repeats = evaluateArgumentToFilterableNodes(context, repeatsArg);

			// No repeats = nothing to "index" = short circuit
			if (repeats.length === 0) {
				return [];
			}

			pairs.push({
				repeats,
				position,
			});
		}

		const { domProvider } = context;

		// Sort the results of each `repeatN`/`indexN` pair, by containment order.
		//
		// Note: the `repeatN`/`indexN` pairs can be supplied in any order (this is
		// consistent with behavior in JavaRosa, likely as a side effect of the
		// function being implemented there by transforming the expression to its
		// LocationPath equivalent).
		pairs = pairs.sort((pairA, pairB) => compareContainmentDepth(domProvider, pairA, pairB));

		// Resolve repeats at the specified/evaluated position, in document depth
		// order by:
		//
		// 1. Filtering each set of repeats to include **only** the nodes contained
		//    by the previously resolved repeat (where one was resolved for a
		//    previous pair).
		//
		// 2. Selecting the repeat at the specified/evaluated position (of those
		//    filtered in 1).
		let repeatContextNode: T;

		for (const [index, pair] of pairs.entries()) {
			const { position } = pair;

			let { repeats } = pair;

			if (index > 0) {
				repeats = pair.repeats.filter((repeat) => {
					return domProvider.isDescendantNode(repeatContextNode, repeat);
				});
			}

			// Select next repeat context at the current `repeatN`/`indexN` position.
			//
			// Note: despite terminology used in the spec, `indexN` is treated as
			// equivalent to an XPath position predicate: it is 1-based.
			const positionedRepeat = repeats[position - 1];

			// No repeat context is found = nothing to target = short-circuit
			if (positionedRepeat == null) {
				return [];
			}

			repeatContextNode = positionedRepeat;
		}

		// Resolve **all** target nodes.
		const targetNodes = evaluateArgumentToFilterableNodes(context, target);

		// Filter only the target nodes contained by the deepest repeat context node.
		return targetNodes.filter((targetNode) => {
			return domProvider.isDescendantNode(repeatContextNode, targetNode);
		});
	}
);

export const instance = new NodeSetFunction(
	'instance',
	[{ arityType: 'required' }],
	(context, [idExpression]) => {
		const id = idExpression!.evaluate(context).toString();
		const instanceElement = XFormsXPathEvaluator.getSecondaryInstance(context, id);

		if (instanceElement == null) {
			return [];
		}

		return [instanceElement];
	}
);

// TODO: Only kinda sorta a node-set fn. Not a boolean fn either though! Returns
// a string... where // does this belong?
export const once = new StringFunction(
	'once',
	[{ arityType: 'required' }],
	(context, [expression]): string => {
		const [contextNode] = context.contextNodes;

		if (contextNode == null) {
			throw 'todo once no context';
		}

		const string = context.domProvider.getNodeValue(contextNode);

		if (string === '') {
			// TODO: probably memoize, it's at least sort of implied by the name
			return expression!.evaluate(context).toString();
		}

		return string;
	}
);

/**
 * @todo this is a weird edge case, which we shouldn't handle here! It isn't
 * even something `@getodk/xpath` should know about! It's unclear from a spec
 * context what the appropriate behavior would/should be. What it's checking for
 * is evaluation of an expression `position(current())` or equivalent, in the
 * context of a `@getodk/xforms-engine`'s representation of a "repeat range".
 * That representation is:
 *
 * 1. Currently associated with a WHAT Working Group DOM comment node.
 * 2. Shortly going to be associated with the `@getodk/xforms-engine`
 *    representation of the same semantic node kind.
 *
 * We treat this as a special case, returning the current context position, as
 * it is the expected behavior. We call it out separately so that it won't
 * prevent us from flagging other unusual usage of arity-1 `position` with
 * non-named nodes (for which, if there is a use case, it is not presently
 * addressed by the ODK XForms
 * {@link https://getodk.github.io/xforms-spec/#fn:position | arity-1 spec extension}).
 */
const isLikelyRepeatRangeEvaluationContextCommentMarkerNode = <T extends XPathNode>(
	context: LocationPathEvaluation<T>,
	node: T
): boolean => {
	const { evaluationContextNode } = context;

	return context.domProvider.isComment(node) && node === evaluationContextNode;
};

/**
 * ~~@todo this probably belongs in `fn`?~~
 *
 * @todo the baseline behavior of this belongs in `fn`. The contiguous same-name
 * node behavior belongs here, presumably as an override.
 *
 * @todo we have at least a couple other override cases. They all extend the
 * baseline behavior. Consider ability to call into overridden baseline (similar
 * to `super` in class inheritance?).
 */
export const position = new NumberFunction(
	'position',
	[{ arityType: 'optional' }],
	(context, [expression]): number => {
		if (expression == null) {
			return context.contextPosition();
		}

		const results = expression.evaluate(context);

		LocationPathEvaluation.assertInstance(context, results);

		const [first, next] = results.values();

		if (first == null) {
			// TODO: is this right? Doesn't seem like any tests exercise it.
			return NaN;
		}

		if (next != null) {
			throw 'todo enforce single node(?)';
		}

		const { domProvider } = context;
		const { value } = first;

		if (!domProvider.isQualifiedNamedNode(value)) {
			if (isLikelyRepeatRangeEvaluationContextCommentMarkerNode(context, value)) {
				return context.contextPosition();
			}

			throw new Error(
				'Cannot get position among contiguous nodes with same name: not a named node.'
			);
		}

		const nodeName = domProvider.getQualifiedName(value);

		let currentNode = value;
		let result = 0;

		do {
			result += 1;

			const previousNode = domProvider.getPreviousSiblingElement(currentNode);

			if (previousNode == null) {
				break;
			}

			currentNode = previousNode;
		} while (domProvider.getQualifiedName(currentNode) === nodeName);

		return result;
	}
);

export const randomize = new NodeSetFunction(
	'randomize',
	[
		{ arityType: 'required', typeHint: 'node' },
		{ arityType: 'optional', typeHint: 'number' },
	],
	(context, [expression, seedExpression]) => {
		const results = expression!.evaluate(context);

		LocationPathEvaluation.assertInstance(context, results);

		const nodeResults = Array.from(results.values());
		const nodes = nodeResults.map(({ value }) => value);

		if (seedExpression === undefined) return seededRandomize(nodes);

		const seed = seedExpression.evaluate(context);
		const asNumber = seed.toNumber(); // TODO: There are some peculiarities to address: https://github.com/getodk/web-forms/issues/240
		let finalSeed: number | bigint | undefined;
		if (Number.isNaN(asNumber)) {
			// Specific behaviors for when a seed value is not interpretable as numeric.
			// We still want to derive a seed in those cases, see https://github.com/getodk/javarosa/issues/800
			const seedString = seed.toString();
			if (seedString === '') {
				finalSeed = 0; // special case: JR behaviour
			} else {
				// any other string, we'll convert to a number via a digest function
				finalSeed = toBigIntHash(seedString);
			}
		} else {
			finalSeed = asNumber;
		}
		return seededRandomize(nodes, finalSeed);
	}
);

const toBigIntHash = (text: string): bigint => {
	/**
	Hash text with sha256, and interpret the first 64 bits of output
	(the first and second int32s ("words") of CryptoJS digest output)
	as an int64 (in JS represented in a BigInt).
	Thus the entropy of the hash is reduced to 64 bits, which
	for some applications is sufficient.
	The underlying representations are big-endian regardless of the endianness
	of the machine this runs on, as is the equivalent JavaRosa implementation.
	({@link https://github.com/getodk/javarosa/blob/ab0e8f4da6ad8180ac7ede5bc939f3f261c16edf/src/main/java/org/javarosa/xpath/expr/XPathFuncExpr.java#L718-L726 | see here}).
	*/
	const buffer = new ArrayBuffer(8);
	const dataview = new DataView(buffer);
	SHA256(text)
		.words.slice(0, 2)
		.forEach((val, ix) => dataview.setInt32(ix * Int32Array.BYTES_PER_ELEMENT, val));
	return dataview.getBigInt64(0);
};
