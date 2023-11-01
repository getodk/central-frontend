import { describe, expect, it } from 'vitest';
import { getNodesetSubExpressions } from './expression-dependencies';

describe('XPath expression dependencies', () => {
	it.each([
		{ expression: '/foo/bar', expected: ['/foo/bar'] },
		{ expression: 'if(/foo = true(), /bar, /quux)', expected: ['/foo', '/bar', '/quux'] },
		{
			expression: 'coalesce(., id("ent")/ity, id("ent"))',
			expected: ['.', 'id("ent")/ity', 'id("ent")'],
		},
		{
			expression: 'current()/context-child > 1',
			expected: ['current()/context-child'],
		},
	])(
		'gets absolute nodeset sub-expressions $subExpressions from expression $expression',
		({ expression, expected }) => {
			const subExpressions = getNodesetSubExpressions(expression);

			expect(subExpressions).toEqual(expected);
		}
	);
});
