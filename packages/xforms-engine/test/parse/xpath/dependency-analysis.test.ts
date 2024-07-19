import { describe, expect, it } from 'vitest';
import { resolveDependencyNodesets } from '../../../src/parse/xpath/dependency-analysis.ts';

describe('Dependency analysis', () => {
	interface FindDependencyNodesetsCase {
		readonly contextNodeset: string | null;
		readonly expression: string;
		readonly expected: readonly string[];
		readonly description: string;
	}

	describe.each<FindDependencyNodesetsCase>([
		{
			description:
				'No context; absolute paths in expression; extracted and returned as-is, already resolved',

			contextNodeset: null,
			expression: '/foo/bar | /bat',
			expected: ['/foo/bar', '/bat'],
		},

		{
			description:
				'Relative context; absolute paths in expression; extracted and returned as-is, already resolved',

			contextNodeset: 'quux',
			expression: '/foo/bar and /bat',
			expected: ['/foo/bar', '/bat'],
		},

		{
			description:
				'Absolute context; absolute paths in expression; extracted and returned as-is, already resolved',

			contextNodeset: '/quux',
			expression: '/foo/bar or /bat',
			expected: ['/foo/bar', '/bat'],
		},

		{
			description:
				'No context; relative paths in expression; extracted and returned as-is, no resolution context available',

			contextNodeset: null,
			expression: 'foo/bar | bat',
			expected: ['foo/bar', 'bat'],
		},

		{
			description:
				'Relative context; relative paths in expression; extracted and contextualized as relative to the input context',

			contextNodeset: 'quux',
			expression: 'foo/bar or bat',
			expected: ['quux/foo/bar', 'quux/bat'],
		},

		{
			description:
				'Absolute context; relative paths in expression; extracted and contextualized as relative to the input context',

			contextNodeset: '/quux',
			expression: 'foo/bar or bat',
			expected: ['/quux/foo/bar', '/quux/bat'],
		},

		{
			description:
				'Absolute context; relative paths with abbreviated self and parent steps; extracted, and abbreviated steps resolved, relative to the input context',

			contextNodeset: '/data/grp',
			expression: './foo/bar and ../quux',
			expected: ['/data/grp/foo/bar', '/data/quux'],
		},

		{
			description:
				'Absolute context; current() FilterExpr paths (one with a subsequent abbreviated parent step); extracted, current() treated as analogous to self step, parent step resolved, finally relative to the input context',

			contextNodeset: '/data/grp',
			expression: 'current()/foo/bar and current()/../quux',
			expected: ['/data/grp/foo/bar', '/data/quux'],
		},

		{
			description: 'No context; instance() and relative path; extracted and returned and as-is',

			contextNodeset: null,
			expression: 'instance("foo")/bar | ./quux',
			expected: ['instance("foo")/bar', './quux'],
		},

		{
			description:
				'Relative context; instance() and relative path; extracted, instance call returned as-is, relative paths resolved to context',

			contextNodeset: 'sel1',
			expression: 'instance("foo")/bar and (bat or ./quux)',
			expected: ['instance("foo")/bar', 'sel1/bat', 'sel1/quux'],
		},

		{
			description:
				'Relative context; instance() and relative path; extracted, instance call returned as-is, relative paths resolved to context',

			contextNodeset: 'sel1',
			expression: 'instance("foo")/bar and (bat or ../quux)',
			expected: ['instance("foo")/bar', 'sel1/bat', 'sel1/../quux'],
		},

		{
			description:
				'Absolute context; instance() and relative path; extracted, instance call returned as-is, relative paths resolved to context',

			contextNodeset: '/data/sel1',
			expression: 'instance("foo")/bar and (bat or ../quux)',
			expected: ['instance("foo")/bar', '/data/sel1/bat', '/data/quux'],
		},

		{
			description:
				'Context is instance("id") descendant. Expression references another instance (resolved as-is); relative sibling and relative child (resolved from context); relative sibling and child with current() calls (likewise resolved from context); absolute reference (resolved as-is)',

			contextNodeset: 'instance("foo")/bar',
			expression:
				'if(position() > 2, instance("quux")/zig, ../zag | ./zag | current()/zag | current()/../zag) or /beep//boop',
			expected: [
				'instance("quux")/zig',
				'instance("foo")/zag',
				'instance("foo")/bar/zag',
				'/beep//boop',
			],
		},

		{
			description:
				'Context is absolute. Expression includes multiple references to instance($some-id); each is extracted and returned as-is',

			contextNodeset: '/data/quux',
			expression: 'instance("first")/foo or instance("second")/bar',
			expected: ['instance("first")/foo', 'instance("second")/bar'],
		},

		{
			description:
				'No context. Expression with instance("id") reference has its own parent steps resolved',

			contextNodeset: null,
			expression: 'instance("first")/foo/bar/../quux',
			expected: ['instance("first")/foo/quux'],
		},

		{
			description: 'Resolution without context: parent steps',

			contextNodeset: null,
			expression: '/data/foo/../bar and foo/bar/../bat or /data/quux/../zig',
			expected: ['/data/bar', 'foo/bat', '/data/zig'],
		},

		{
			description:
				'Arbitrary FilterExpr with either a trailing Step or a Predicate (without any specialized handling for the FunctionName in use)',

			contextNodeset: null,
			expression: 'foo("bar", /bat)/quux and zig()[zag]',
			expected: ['foo("bar", /bat)/quux', 'zig()', 'zig()/zag'],
		},

		{
			description:
				'Absolute context; multiple references to the same relative node, with different predicates; resolves single nodeset, relative to context, with predicates removed',

			contextNodeset: '/data/foo',
			expression: 'bar[1] | bar[position() = 2 or position() > 3]',
			expected: ['/data/foo/bar'],
		},

		{
			description:
				"Absolute context; absolute path expression, with predicate referencing both a relative child node and an absolute node. Resolves: 1) absolute path from expression, with predicate stripped; 2) absolute path to child referenced in predicate (as resolved to the expression's absolute path); 3) absolute path as specified in the predicate",

			contextNodeset: '/data/foo',
			expression: '/data/bar[bat = /data/quux]',
			expected: ['/data/bar', '/data/bar/bat', '/data/quux'],
		},

		{
			description:
				"Absolute context; relative path expression, with predicate referencing child, sibling, and absolute nodes. Resolves: 1) main path expression resolved to absolute context, with predicate stripped; 2) absolute path to predicate's child expression, relative to resolved main path; 3) absolute path to predicate's sibling expression, relative to resolved main path; 4) predicate's absolute expression",

			contextNodeset: '/data/foo',
			expression: 'quux[./zig = ../zag or /data/bar = false()]',
			expected: ['/data/foo/quux', '/data/foo/quux/zig', '/data/foo/zag', '/data/bar'],
		},

		{
			description:
				'Relative context; absolute expression -> stripped predicate, relative from predicate -> relative to that expression, absolute from predicate -> as-is; relative expression -> resolved to context + stripped predicate, child from predicate resolved to that, sibling from predicate resolved to that, absolute from predicate resolved as-is',

			contextNodeset: 'foo',
			expression: '/data/bar[bat = /data/quux] | quux[./zig = ../zag or /data/beep = false()]',
			expected: [
				'/data/bar',
				'/data/bar/bat',
				'/data/quux',
				'foo/quux',
				'foo/quux/zig',
				'foo/zag',
				'/data/beep',
			],
		},

		{
			description:
				'Absolute expression context; absolute expression -> stripped predicate; relative predicate expression resolved to that; predicate references beginning with current() FilterExpr -> relative to expression context',

			contextNodeset: '/data/foo',
			expression: '/data/bar[./quux or current()/bat or current()/../quux]',
			expected: ['/data/bar', '/data/bar/quux', '/data/foo/bat', '/data/quux'],
		},

		{
			description: 'Multiple self steps elided',

			contextNodeset: '/data/foo',
			expression: './././bar/./quux',
			expected: ['/data/foo/bar/quux'],
		},

		{
			description: 'Multiple parent steps resolved',

			contextNodeset: '/data/foo/bar/bat/quux/zig/zag',
			expression:
				'concat(../sibling, ../../parent-sibling, ../../../impertinent/../grandparent-sibling)',
			expected: [
				'/data/foo/bar/bat/quux/zig/sibling',
				'/data/foo/bar/bat/quux/parent-sibling',
				'/data/foo/bar/bat/grandparent-sibling',
			],
		},

		{
			description: 'Absolute context; self reference (direct or redundant) resolved to context',

			contextNodeset: '/data/foo',
			expression: '. = 1 or ./. = 2',
			expected: ['/data/foo'],
		},

		{
			description: 'Relative context; self reference (direct or redundant) resolved to context',

			contextNodeset: 'foo',
			expression: '. != false() and ./. != false()',
			expected: ['foo'],
		},

		{
			description: 'No context; self reference preserved',

			contextNodeset: null,
			expression: '. > now()',
			expected: ['.'],
		},

		{
			description: 'No context; redundant self reference simplified',

			contextNodeset: null,
			expression: './. > now()',
			expected: ['.'],
		},

		{
			description: 'Unabbreviated self::node() and self::* treated as .',

			contextNodeset: '/data/foo',
			expression: 'self::node()/bar | self::node()/quux',
			expected: ['/data/foo/bar', '/data/foo/quux'],
		},

		{
			description: 'Unabbreviated parent::node() and parent::* treated as ..',

			contextNodeset: '/data/foo',
			expression: 'parent::node()/bar and parent::*/quux',
			expected: ['/data/bar', '/data/quux'],
		},

		{
			description: 'self::node() context, parent::node()/* collapsed like ./../*',

			contextNodeset: 'self::node()',
			expression: 'parent::node()/bar',
			expected: ['../bar'],
		},

		{
			description: 'self::* context, parent::*/* collapsed like ./../*',

			contextNodeset: 'self::*',
			expression: 'parent::*/bar',
			expected: ['../bar'],
		},

		{
			description: '// special cases',

			contextNodeset: null,
			expression: '//. | //./foo | //.. | //../foo',
			expected: ['//.', '//foo', '//..'],
		},

		// This case exists to test removal of such a special case.
		//
		// Discussion here: https://github.com/getodk/web-forms/pull/166#discussion_r1680168253
		{
			description: 'null is not a keyword, nor special cased',
			contextNodeset: '/data',
			expression: 'count(null) > count(foo/null)',
			expected: ['/data/null', '/data/foo/null'],
		},
	])('$description', ({ contextNodeset, expression, expected }) => {
		it(`resolves nodeset dependencies in expression ${JSON.stringify(expression)}, with context ${JSON.stringify(contextNodeset)}, producing nodesets: ${JSON.stringify(expected)}`, () => {
			const actual = resolveDependencyNodesets(contextNodeset, expression);

			expect(actual).toEqual(expected);
		});
	});

	// TODO! This was explored but it introduced a variety of complexities beyond
	// an already fairly large chunk of work on this pass. Note also that
	// parentheses can have surprising effects on a path expression's semantics!
	// (For instance: see note on predicates and ordering in
	// https://www.w3.org/TR/1999/REC-xpath-19991116/#node-sets).
	it.fails('resolves parenthesized portions of sub-expressions', () => {
		const contextNodeset = '/data/foo';
		const expression = '(current())/bar';
		const expected = ['/data/foo/bar'];

		const actual = resolveDependencyNodesets(contextNodeset, expression);

		expect(actual).toEqual(expected);
	});
});
