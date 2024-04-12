import { describe, expect, it } from 'vitest';
import { getNodesetDependencies, isItextFunctionCalled } from '../../../src/lib/xpath/analysis.ts';

describe('XPath expression analysis', () => {
	describe('nodeset dependencies', () => {
		it.each([
			{ expression: '/foo/bar', expected: new Set(['/foo/bar']) },
			{
				expression: 'if(/foo = true(), /bar, /quux)',
				expected: new Set(['/foo', '/bar', '/quux']),
			},
			{
				expression: 'coalesce(., id("ent")/ity, id("ent"))',
				expected: new Set(['.']),
			},
			// TODO: this should be resolved based on the `current()` context
			// {
			// 	expression: 'current()/context-child > 1',
			// 	expected: new Set(['current()/context-child']),
			// },
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
					contextReference: '/root/a/b',
				},
				expected: new Set(['/root/a']),
			},
			{
				expression: './c',
				options: {
					contextReference: '/root/a/b',
				},
				expected: new Set(['/root/a/b/c']),
			},
			{
				expression: '/root/unrelated/c',
				options: {
					contextReference: '/root/a/b',
				},
				expected: new Set(['/root/unrelated/c']),
			},
		])(
			'resolves absolute dependencies $expected, relative to a context expression option $options.contextReference',
			({ expression, options, expected }) => {
				const dependencies = getNodesetDependencies(expression, options);

				expect(dependencies).toEqual(expected);
			}
		);
	});

	describe('translation dependencies', () => {
		it.each([
			{ expression: 'jr:itext("foo")', expected: true },
			{ expression: '/root/bar', expected: false },
			{ expression: '/root/bat[jr:itext("this-is-weird-but-whatevz")]', expected: true },
			// TODO
			// { expression: 'other:itext("namespaces-matter!")', expected: false },
		])(
			'determines if the `jr:itext` function was called ($expression: $expected)',
			({ expression, expected }) => {
				const actual = isItextFunctionCalled(expression);

				expect(actual).toBe(expected);
			}
		);
	});
});
