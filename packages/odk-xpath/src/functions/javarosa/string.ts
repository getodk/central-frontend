import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { XFormsXPathEvaluator } from '../../index.ts';
import {
	getDefaultTextValueElement,
	getTranslationTextByLanguage,
} from '../../xforms/XFormsItextTranslations.ts';

export const itext = new StringFunction(
	'itext',
	[{ arityType: 'required', typeHint: 'string' }],
	(context, [itextIDExpression]) => {
		const { evaluator } = context;

		if (!(evaluator instanceof XFormsXPathEvaluator)) {
			throw new Error('itext not available');
		}

		const { modelElement } = evaluator;

		if (modelElement == null) {
			return '';
		}

		const activeLanguage = evaluator.translations.getActiveLanguage();

		if (activeLanguage == null) {
			return '';
		}

		const itextID = itextIDExpression!.evaluate(context).toString();
		const textElement = getTranslationTextByLanguage(modelElement, activeLanguage, itextID);

		if (textElement == null) {
			return '';
		}

		const defaultTextValue = getDefaultTextValueElement(textElement);

		return defaultTextValue?.textContent ?? '';
	}
);
