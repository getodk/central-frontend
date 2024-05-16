import {
	trimXMLXPathWhitespace,
	xmlXPathWhitespaceSeparatedList,
} from '@getodk/common/lib/string/whitespace.ts';
import { BooleanFunction } from '../../evaluator/functions/BooleanFunction.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { evaluateInt } from '../_shared/number.ts';

export const countSelected = new NumberFunction(
	'count-selected',
	[{ arityType: 'required' }],
	(context, [listExpression]): number => {
		const string = trimXMLXPathWhitespace(listExpression!.evaluate(context).toString());

		if (string.length === 0) {
			return 0;
		}

		// TODO: count matches, don't waste time allocating a list we don't use
		return xmlXPathWhitespaceSeparatedList(string).length;
	}
);

export const selected = new BooleanFunction(
	'selected',
	[{ arityType: 'required' }, { arityType: 'required' }],
	(context, [listExpression, valueExpression]): boolean => {
		const list = xmlXPathWhitespaceSeparatedList(listExpression!.evaluate(context).toString());

		if (list.length === 0) {
			return false;
		}

		const value = trimXMLXPathWhitespace(valueExpression!.evaluate(context).toString());

		return list.includes(value);
	}
);

export const selectedAt = new StringFunction(
	'selected-at',
	[{ arityType: 'required' }, { arityType: 'required', typeHint: 'number' }],
	(context, [listExpression, indexExpression]): string => {
		const list = xmlXPathWhitespaceSeparatedList(listExpression!.evaluate(context).toString());
		const index = evaluateInt(context, indexExpression!);

		return list[index] ?? '';
	}
);
