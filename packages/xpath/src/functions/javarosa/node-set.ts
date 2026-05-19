import { NodeSetFunction } from '../../evaluator/functions/NodeSetFunction.ts';
import { XFormsXPathEvaluator } from '../../xforms/XFormsXPathEvaluator.ts';

export const itext = new NodeSetFunction(
	'itext',
	[{ arityType: 'required', typeHint: 'string' }],
	(context, [itextIDExpression]) => {
		const itextID = itextIDExpression!.evaluate(context).toString();
		return XFormsXPathEvaluator.getTranslationValues(context, itextID) ?? [];
	}
);
