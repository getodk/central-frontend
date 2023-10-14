import { LocationPathEvaluation } from '../../evaluations/LocationPathEvaluation.ts';
import { NodeSetFunction } from '../../evaluator/functions/NodeSetFunction.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { seededRandomize } from '../../lib/collections/sort.ts';

export const countNonEmpty = new NumberFunction(
  [
    { arityType: 'required' },
  ],
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
  },
  { localName: 'count-non-empty' }
);

// TODO: Only kinda sorta a node-set fn. Not a boolean fn either though! Returns
// a string... where // does this belong?
export const once = new StringFunction(
  [{ arityType: 'required'}],
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
)

export const position = new NumberFunction(
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

    let currentNode: MaybeElementNode | null = value;
    let position = 1;

    while ((currentNode = currentNode.previousSibling) != null) {
      if (currentNode.nodeName === nodeName) {
        position += 1;
      }
    }

    return position;
  }
);

export const randomize = new NodeSetFunction([
  { arityType: 'required', typeHint: 'node' },
  { arityType: 'optional', typeHint: 'number' },
], (context, [expression, seedExpression]) => {
  const results = expression!.evaluate(context);

  if (!(results instanceof LocationPathEvaluation)) {
    throw 'todo (not a node-set)';
  }

  const nodeResults = Array.from(results.values());
  const nodes = nodeResults.map(({ value }) => value);
  const seed = seedExpression?.evaluate(context).toNumber();

  return seededRandomize(nodes, seed);
});
