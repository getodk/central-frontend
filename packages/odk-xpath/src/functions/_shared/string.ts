import type { EvaluationContext } from '../../context/EvaluationContext.ts';
import type { EvaluableArgument } from '../../evaluator/functions/FunctionImplementation.ts';

export const toStrings = (
	context: EvaluationContext,
	expressions: readonly EvaluableArgument[]
): readonly string[] => {
	return expressions.flatMap((arg) => {
		const result = arg.evaluate(context);

		switch (result.type) {
			case 'NODE':
				return [...result].map((value) => value.toString());
		}

		return result.toString();
	});
};

const XPATH_WHITESPACE_SUBPATTERN = '[\\x20\\x09\\x0D\\x0A]';
const XPATH_WHITESPACE_PATTERN = new RegExp(XPATH_WHITESPACE_SUBPATTERN, 'g');
const XPATH_LEADING_TRAILING_WHITESPACE_PATTERN = new RegExp(
	`^${XPATH_WHITESPACE_SUBPATTERN}+|${XPATH_WHITESPACE_SUBPATTERN}+$`,
	'g'
);
const XPATH_REPEATING_WHITESPACE_PATTERN = new RegExp(`${XPATH_WHITESPACE_SUBPATTERN}{2,}`, 'g');

export const trimXPathWhitespace = (value: string): string =>
	value.replaceAll(XPATH_LEADING_TRAILING_WHITESPACE_PATTERN, '');

export const normalizeXPathWhitespace = (value: string): string =>
	trimXPathWhitespace(value).replaceAll(XPATH_REPEATING_WHITESPACE_PATTERN, ' ');

export const whitespaceSeparatedList = (value: string): readonly string[] => {
	return normalizeXPathWhitespace(value).split(XPATH_WHITESPACE_PATTERN);
};
