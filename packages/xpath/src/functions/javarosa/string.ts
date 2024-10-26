import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { XFormsXPathEvaluator } from '../../xforms/XFormsXPathEvaluator.ts';

export const itext = new StringFunction(
	'itext',
	[{ arityType: 'required', typeHint: 'string' }],
	(context, [itextIDExpression]) => {
		const itextID = itextIDExpression!.evaluate(context).toString();

		return XFormsXPathEvaluator.getDefaultTranslationText(context, itextID);
	}
);
