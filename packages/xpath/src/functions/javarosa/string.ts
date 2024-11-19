import { NodeSetFunction } from '../../evaluator/functions/NodeSetFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { XFormsXPathEvaluator } from '../../xforms/XFormsXPathEvaluator.ts';

/**
 * @todo This could be a {@link NodeSetFunction}. If it were, that might be a
 * good starting point for thinking about how we'll support:
 *
 * - `<output>` in itext translations
 * - `<value form="...">` (short, guidance, various media types)
 */
export const itext = new StringFunction(
	'itext',
	[{ arityType: 'required', typeHint: 'string' }],
	(context, [itextIDExpression]) => {
		const itextID = itextIDExpression!.evaluate(context).toString();

		return XFormsXPathEvaluator.getDefaultTranslationText(context, itextID);
	}
);
