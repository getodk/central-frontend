import { UpsertableWeakMap } from '@getodk/common/lib/collections/UpsertableWeakMap.ts';
import { ScopedElementLookup } from '@getodk/common/lib/dom/compatibility.ts';
import type { LocalNamedElement } from '@getodk/common/types/dom.ts';
import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import { NodeSetFunction } from '../../evaluator/functions/NodeSetFunction.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { XFormsXPathEvaluator } from '../../index.ts';
import { seededRandomize } from '../../lib/collections/sort.ts';
import type { MaybeElementNode } from '../../lib/dom/types.ts';
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

interface InstanceElement extends LocalNamedElement<'instance'> {}

const identifiedInstanceLookup = new ScopedElementLookup(':scope > instance[id]', 'instance[id]');

type InstanceID = string;

const instancesCache = new UpsertableWeakMap<
	ModelElement,
	ReadonlyMap<InstanceID | null, InstanceElement>
>();

const getInstanceElementByID = (modelElement: ModelElement, id: string): Element | null => {
	const instances = instancesCache.upsert(modelElement, () => {
		const instanceElements = Array.from(
			identifiedInstanceLookup.getElements<InstanceElement>(modelElement)
		);

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
