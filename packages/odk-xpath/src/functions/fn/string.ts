import { BooleanFunction } from '../../evaluator/functions/BooleanFunction.ts';
import { NumberFunction } from '../../evaluator/functions/NumberFunction.ts';
import { StringFunction } from '../../evaluator/functions/StringFunction.ts';
import { escapeRegExp } from '../../lib/regex/escape.ts';
import { normalizeXPathWhitespace } from '../_shared/string.ts';

export const concat = new StringFunction(
  [
    { arityType: 'variadic', typeHint: 'string'},
  ],
  (context, expressions): string => {
    if (expressions.length === 0) {
      return '';
    }

    return expressions.reduce((acc, expression) => (
      `${acc}${expression.evaluate(context).toString()}`
    ), '');
  }
);

export const contains = new BooleanFunction(
  [
    { arityType: 'required', typeHint: 'string'},
    { arityType: 'required', typeHint: 'string'},
  ],
  (context, [haystackExpression, needleExpression]): boolean => {
    const haystack = haystackExpression!.evaluate(context).toString();

    return haystack.includes(needleExpression!.evaluate(context).toString());
  }
);

export const normalizeSpace = new StringFunction(
  [
    { arityType: 'optional', typeHint: 'string'},
  ],
  (context, [expression]): string => {
    const value = (expression?.evaluate(context) ?? context).toString();

    return normalizeXPathWhitespace(value);
  },
  { localName: 'normalize-space' }
);

export const startsWith = new BooleanFunction(
  [
    { arityType: 'required', typeHint: 'string'},
    { arityType: 'required', typeHint: 'string'},
  ],
  (context, [haystackExpression, needleExpression]): boolean => {
    const haystack = haystackExpression!.evaluate(context).toString();
    const needle = needleExpression!.evaluate(context).toString();

    return haystack.startsWith(needle);
  },
  { localName: 'starts-with' }
);

export const stringLength = new NumberFunction(
  [{ arityType: 'optional', typeHint: 'string'}],
  (context, [expression]): number => {
    return (expression?.evaluate(context) ?? context).toString().length;
  },
  { localName: 'string-length' }
);

export const substringAfter = new StringFunction(
  [
    { arityType: 'required', typeHint: 'string' },
    { arityType: 'required', typeHint: 'string' },
  ],
  (context, [haystackExpression, needleExpression]): string => {
    const haystack = haystackExpression!.evaluate(context).toString();

    if (haystack === '') {
      return '';
    }

    const needle = needleExpression!.evaluate(context).toString();

    if (needle === '') {
      return haystack;
    }

    const needleIndex = haystack.indexOf(needle);

    return needleIndex === -1
      ? ''
      : haystack.slice(needleIndex + 1);
  },
  { localName: 'substring-after' }
);

export const substringBefore = new StringFunction(
  [{ arityType: 'required'}, { arityType: 'required', typeHint: 'string'}],
  (context, [haystackExpression, needleExpression]): string => {
    const haystack = haystackExpression!.evaluate(context).toString();

    if (haystack === '') {
      return '';
    }

    const needle = needleExpression!.evaluate(context).toString();
    const needleIndex = haystack.indexOf(needle);

    return needleIndex === -1
      ? ''
      : haystack.slice(0, needleIndex);
  },
  { localName: 'substring-before' }
);

export const substring = new StringFunction(
  [
    { arityType: 'required' },
    { arityType: 'required', typeHint: 'number' },
    { arityType: 'optional', typeHint: 'number' },
  ],
  (context, [stringExpression, startExpression, lengthExpression]): string => {
    const string = stringExpression!.evaluate(context).toString();

    if (string === '') {
      return string;
    }

    let start = Math.round(startExpression!.evaluate(context).toNumber()) - 1;

    if (start === Number.POSITIVE_INFINITY || Number.isNaN(start)) {
      return '';
    }

    let length = lengthExpression?.evaluate(context).toNumber();

    if (length != null && Number.isNaN(length)) {
      return '';
    }

    const end = length == null
      ? string.length
      : (start + Math.round(length));

    return string.substring(start, end);
  }
);

export const string = new StringFunction(
  [{ arityType: 'optional' }],
  (context, [expression]
  ): string => (expression?.evaluate(context) ?? context).toString()
);

export const translate = new StringFunction(
  [
    { arityType: 'required', typeHint: 'string' },
    { arityType: 'required', typeHint: 'string' },
    { arityType: 'required', typeHint: 'string' },
  ],
  (context, [haystackExpression, needlesExpression, replacementsExpression]): string => {
    const haystack = haystackExpression!.evaluate(context).toString();
    const needles = needlesExpression!.evaluate(context).toString().split('');
    const replacements = replacementsExpression!.evaluate(context).toString().split('');

    const replacementMap = needles.reduce((acc, needle, index) => {
      if (acc.has(needle)) {
        return acc;
      }

      const replacement = replacements[index] ?? '';

      acc.set(needle, replacement);

      return acc;
    }, new Map<string, string>());

    const needleSubPatterns = needles.map((needle) => escapeRegExp(needle));
    const pattern = new RegExp(`(${needleSubPatterns.join('|')})`, 'g');

    return haystack.replaceAll(pattern, (match) => {
      const replacement = replacementMap.get(match) ?? '';

      return replacement;
    });
  }
);
