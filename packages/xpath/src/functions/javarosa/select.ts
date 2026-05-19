import type { XPathChoiceNode } from '../../adapter/interface/XPathChoiceNode.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';

/**
 * jr:choice-name function
 * https://getodk.github.io/xforms-spec/#fn:jr:choice-name
 *
 * The first parameter is evaluated to the value to find the label for. Can be a string literal,
 * or a xpath reference which resolves to a string.
 * The second parameter is the xpath reference to the element which enumerates the choices,
 * either by items or an itemset. Valid elements must implement the {@link XPathChoiceNode}
 * interface.
 * Returns the label which can be translated, calculated, and contain markup, for the given
 * choice of the given element.
 */
export const choiceName = new StringFunction(
	'choice-name',
	[
		{ arityType: 'required', typeHint: 'string' },
		{ arityType: 'required', typeHint: 'string' },
	],
	(context, [nodeExpression, valueExpression]) => {
		const node = nodeExpression!.evaluate(context).toString();
		const value = valueExpression!.evaluate(context).toString();

		const [contextNode] = context.contextNodes;
		const { domProvider } = context;
		let nodes;
		if (contextNode && domProvider.isElement(contextNode)) {
			nodes = context.evaluator.evaluateNodes(value, { contextNode });
		} else {
			nodes = context.evaluator.evaluateNodes(value);
		}

		const firstNode = nodes?.[0];
		if (!firstNode) {
			throw new Error(`No element found by evaluating '${value}'`);
		}
		if (!('getChoiceName' in firstNode)) {
			throw new Error(
				`Evaluating 'jr:choice-name' on element '${value}' which has no possible choices.`
			);
		}
		return (firstNode as XPathChoiceNode).getChoiceName(node) ?? '';
	}
);
