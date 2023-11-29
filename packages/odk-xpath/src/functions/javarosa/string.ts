import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { XFormsXPathEvaluator } from '../../index.ts';

export const itext = new StringFunction(
	'itext',
	[{ arityType: 'required', typeHint: 'string' }],
	(context, [idExpression]) => {
		const { evaluator } = context;

		if (!(evaluator instanceof XFormsXPathEvaluator)) {
			throw new Error('itext not available');
		}

		const id = idExpression!.evaluate(context).toString();

		return evaluator.translations.getTranslation(id) ?? '';
	}
);
