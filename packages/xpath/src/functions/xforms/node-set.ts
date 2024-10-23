import { UpsertableWeakMap } from '@getodk/common/lib/collections/UpsertableWeakMap.ts';
import type { KnownAttributeLocalNamedElement } from '@getodk/common/types/dom.ts';
import type { Evaluation } from '../../evaluations/Evaluation.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import type { EvaluableArgument } from '../../evaluator/functions/FunctionImplementation.ts';
import { NodeSetFunction } from '../../evaluator/functions/NodeSetFunction.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { XFormsXPathEvaluator } from '../../index.ts';
import { seededRandomize } from '../../lib/collections/sort.ts';
import type { ContextNode, MaybeElementNode } from '../../lib/dom/types.ts';
import type { ModelElement } from '../../xforms/XFormsXPathEvaluator.ts';

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

type AssertIsLocationPathEvaluation = (
	evaluation?: Evaluation
) => asserts evaluation is LocationPathEvaluation;

/**
 * @todo This is a concern in several `FunctionImplementation`s. It would be
 * much nicer if it were handled as part of the signature, then inferred in the
 * types and validated automatically at runtime. It would also make sense, as a
 * minor stopgap improvement, to generalize checks like this in a single place
 * (e.g. as a static method on {@link LocationPathEvaluation} itself). Deferred
 * here because there is exploratory work on both, but both are out of scope for
 * work in progress to support {@link indexedRepeat}.
 */
const assertIsLocationPathEvaluation: AssertIsLocationPathEvaluation = (evaluation) => {
	if (!(evaluation instanceof LocationPathEvaluation)) {
		throw new Error('Expected a node-set result');
	}
};

/**
 * Note: this function is not intended to be general outside of usage by
 * {@link indexedRepeat}.
 *
 * Evaluation of the provided argument is eager—i.e. materializing the complete
 * array of results, rather than the typical `Iterable<ContextNode>` produced in
 * most cases—because it is expected that in most cases the eagerness will not
 * be terribly expensive, and all results will usually be consumed, either to be
 * indexed or filtered in other ways applicable at call sites.
 *
 * Function is named to reflect that expectation.
 */
const evaluateArgumentToFilterableNodes = (
	context: LocationPathEvaluation,
	arg: EvaluableArgument
): readonly ContextNode[] => {
	const evaluation = arg.evaluate(context);

	assertIsLocationPathEvaluation(evaluation);

	return Array.from(evaluation.contextNodes);
};

interface EvaluatedIndexedRepeatArgumentPair {
	readonly repeats: readonly ContextNode[];
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
const compareContainmentDepth = (
	{ repeats: a }: EvaluatedIndexedRepeatArgumentPair,
	{ repeats: b }: EvaluatedIndexedRepeatArgumentPair
): DepthSortResult => {
	for (const repeatA of a) {
		for (const repeatB of b) {
			if (repeatA.contains(repeatB)) {
				return -1;
			}

			if (repeatB.contains(repeatA)) {
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
	(context, args) => {
		// First argument is `target` (per spec) of the deepest resolved repeat
		const target = args[0]!;

		let pairs: EvaluatedIndexedRepeatArgumentPair[] = [];

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

		// Sort the results of each `repeatN`/`indexN` pair, by containment order.
		//
		// Note: the `repeatN`/`indexN` pairs can be supplied in any order (this is
		// consistent with behavior in JavaRosa, likely as a side effect of the
		// function being implemented there by transforming the expression to its
		// LocationPath equivalent).
		pairs = pairs.sort(compareContainmentDepth);

		// Resolve repeats at the specified/evaluated position, in document depth
		// order by:
		//
		// 1. Filtering each set of repeats to include **only** the nodes contained
		//    by the previously resolved repeat (where one was resolved for a
		//    previous pair).
		//
		// 2. Selecting the repeat at the specified/evaluated position (of those
		//    filtered in 1).
		let repeatContextNode: ContextNode;

		for (const [index, pair] of pairs.entries()) {
			const { position } = pair;

			let { repeats } = pair;

			if (index > 0) {
				repeats = pair.repeats.filter((repeat) => {
					return repeatContextNode.contains(repeat);
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
			return repeatContextNode.contains(targetNode);
		});
	}
);

interface IdentifiedInstanceElement extends KnownAttributeLocalNamedElement<'instance', 'id'> {}

const identifiedInstanceLookup = {
	getElements: (contextNode: ParentNode): readonly IdentifiedInstanceElement[] => {
		return Array.from(contextNode.children).filter((child): child is IdentifiedInstanceElement => {
			return child.localName === 'instance' && child.hasAttribute('id');
		});
	},
};

type InstanceID = string;

const instancesCache = new UpsertableWeakMap<
	ModelElement,
	ReadonlyMap<InstanceID | null, IdentifiedInstanceElement>
>();

const getInstanceElementByID = (modelElement: ModelElement, id: string): Element | null => {
	const instances = instancesCache.upsert(modelElement, () => {
		const instanceElements = Array.from(identifiedInstanceLookup.getElements(modelElement));

		return new Map(
			instanceElements.map((element) => {
				return [element.getAttribute('id'), element];
			})
		);
	});

	return instances.get(id) ?? null;
};

export const instance = new NodeSetFunction(
	'instance',
	[{ arityType: 'required' }],
	(context, [idExpression]): readonly Element[] => {
		const id = idExpression!.evaluate(context).toString();
		const { evaluator } = context;

		if (!(evaluator instanceof XFormsXPathEvaluator)) {
			throw new Error('itext not available');
		}

		const { modelElement } = evaluator;

		if (modelElement == null) {
			return [];
		}

		const instanceElement = getInstanceElementByID(modelElement, id);

		return instanceElement == null ? [] : [instanceElement];
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

		const string = contextNode.textContent ?? '';

		if (string === '') {
			// TODO: probably memoize, it's at least sort of implied by the name
			return expression!.evaluate(context).toString();
		}

		return string;
	}
);

// TODO: this probably belongs in `fn`?
export const position = new NumberFunction(
	'position',
	[{ arityType: 'optional' }],
	(context, [expression]): number => {
		if (expression == null) {
			return context.contextPosition();
		}

		const results = expression.evaluate(context);

		if (!(results instanceof LocationPathEvaluation)) {
			throw 'todo not a node-set';
		}

		const [first, next] = results.values();

		if (first == null) {
			// TODO: is this right? Doesn't seem like any tests exercise it.
			return NaN;
		}

		if (next != null) {
			throw 'todo enforce single node(?)';
		}

		const { value } = first;
		const { nodeName } = value as MaybeElementNode;

		let currentNode: MaybeElementNode | null = value as MaybeElementNode;
		let result = 1;

		while ((currentNode = currentNode!.previousSibling as MaybeElementNode | null) != null) {
			if (currentNode.nodeName === nodeName) {
				result += 1;
			}
		}

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

		if (!(results instanceof LocationPathEvaluation)) {
			throw 'todo (not a node-set)';
		}

		const nodeResults = Array.from(results.values());
		const nodes = nodeResults.map(({ value }) => value);
		const seed = seedExpression?.evaluate(context).toNumber();

		return seededRandomize(nodes, seed);
	}
);
