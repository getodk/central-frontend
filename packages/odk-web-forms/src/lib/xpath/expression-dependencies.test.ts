import { describe, expect, it } from 'vitest';
import { getNodesetDependencies } from './expression-dependencies';

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
		'gets absolute nodeset sub-expression dependencies $expected from expression $expression',
		({ expression, expected }) => {
			const dependencies = getNodesetDependencies(expression);

			expect(dependencies).toEqual(expected);
		}
	);

	it.each([
		{
			expression: '..',
			options: {
				contextExpression: '/root/a/b',
			},
			expected: ['/root/a'],
		},
		{
			expression: './c',
			options: {
				contextExpression: '/root/a/b',
			},
			expected: ['/root/a/b/c'],
		},
		{
			expression: '/root/unrelated/c',
			options: {
				contextExpression: '/root/a/b',
			},
			expected: ['/root/unrelated/c'],
		},
	])(
		'resolves absolute dependencies $expected, relative to a context expression option $options.contextExpression',
		({ expression, options, expected }) => {
			const dependencies = getNodesetDependencies(expression, options);

			expect(dependencies).toEqual(expected);
		}
	);
});
