import { xml } from '@getodk/common/test/factories/xml.ts';
import { XFormsXPathEvaluator } from '@getodk/xpath';
import { assert, beforeEach, describe, expect, it } from 'vitest';
import {
	resolveDependencyNodesets,
	type PathResolutionOptions,
} from '../../../src/parse/xpath/dependency-analysis.ts';

describe('Dependency analysis', () => {
	interface ResolveDependencyNodesetsCase {
		readonly description: string;
		readonly contextNodeset: string | null;
		readonly ignoreReferenceToContextPath?: boolean;
		readonly expression: string;
		readonly expected: readonly string[];
	}

	describe.each<ResolveDependencyNodesetsCase>([
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
				'Context is instance("id") descendant. Expression references another instance (resolved as-is); relative sibling and relative child (resolved from context); absolute reference (resolved as-is)',

			contextNodeset: 'instance("foo")/bar',
			expression: 'if(position() > 2, instance("quux")/zig, ./zag | ../zag) or /beep//boop',
			expected: [
				'instance("quux")/zig',
				'instance("foo")/bar/zag',
				'instance("foo")/zag',
				'/beep//boop',
			],
		},

		{
			description:
				'Context is instance("id") descendant. Expression references another instance (resolved as-is); relative sibling and child with current() calls (likewise resolved from context); absolute reference (resolved as-is)',

			contextNodeset: 'instance("foo")/bar',
			expression:
				'if(position() > 2, instance("quux")/zig, current()/zag | current()/../zag) or /beep//boop',
			expected: [
				'instance("quux")/zig',
				'instance("foo")/bar/zag',
				'instance("foo")/zag',
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
			expected: ['foo("bar", /bat)/quux', '/bat', 'zig()', 'zig()/zag'],
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
			description: 'descendant-or-self case: //.',
			contextNodeset: null,
			expression: 'fn-name-does-not-matter(//.)',
			expected: ['//.'],
		},
		{
			description: 'descendant-or-self case: //./foo',
			contextNodeset: null,
			expression: 'yep(//./foo)',
			expected: ['//foo'],
		},
		{
			description: 'descendant-or-self case: //..',
			contextNodeset: null,
			expression: 'nope(//..)',
			expected: ['//..'],
		},
		{
			description: 'descendant-or-self case: //../foo',
			contextNodeset: null,
			expression: 'maybe(//../foo)',
			expected: ['//foo'],
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

		{
			description:
				'Results are set-like: each resolved path is only produced once, even if the resolved from multiple sub-expressions',

			contextNodeset: '/data/foo',
			expression: `count(
				bar |
				bar/bat |

				./bar |
				./bar/bat |

				bat/../bar |
				quux/../bar/bat
			)`,
			expected: ['/data/foo/bar', '/data/foo/bar/bat'],
		},

		// Responsive to point 7 in
		// https://github.com/getodk/web-forms/pull/166#issuecomment-2243849828
		{
			description:
				'Resolved path expressions would reference context, but all are ignored by `ignoreReferenceToContextPath: true`. Note: there are three sub-expressions which would resolve to the same nodeset as `contextNodeset`; the empty result indicates option is consistent with set-like behavior',

			contextNodeset: '/data/foo',
			ignoreReferenceToContextPath: true,
			expression: '. | current() | ../foo',
			expected: [],
		},

		// Responsive to point 7 in
		// https://github.com/getodk/web-forms/pull/166#issuecomment-2243849828
		{
			description:
				'Resolved path expressions would reference context, **NOT IGNORED** (`ignoreReferenceToContextPath: false`). Note: there are three sub-expressions which resolve to the same nodeset as `contextNodeset`; the single result indicates option is consistent with set-like behavior',

			contextNodeset: '/data/foo',
			ignoreReferenceToContextPath: false,
			expression: '. | current() | ../foo',
			expected: ['/data/foo'],
		},
	])('$description', ({ contextNodeset, ignoreReferenceToContextPath, expression, expected }) => {
		it(`resolves nodeset dependencies in expression ${JSON.stringify(expression)}, with context ${JSON.stringify(contextNodeset)}, producing nodesets: ${JSON.stringify(expected)}`, () => {
			let options: PathResolutionOptions | undefined;

			if (ignoreReferenceToContextPath != null) {
				options = { ignoreReferenceToContextPath };
			}

			const actual = resolveDependencyNodesets(contextNodeset, expression, options);

			expect(actual).toEqual(expected);
		});
	});

	// These questions are taken from the linked PR comment. Some of the question
	// text has been lightly edited to clarify intent.
	describe('Questions from https://github.com/getodk/web-forms/pull/166#issuecomment-2243849828', () => {
		interface ExplainedCase extends ResolveDependencyNodesetsCase {
			readonly explanation: string;
		}

		describe("1- Why are the following two different? If contextNodeset is relative, shouldn't current() to resolve as relative nodeset. (From comment in example: shouldn't ['whatever'] be '/data/whatever'??)", () => {
			const cases: readonly ExplainedCase[] = [
				{
					description: 'relative context; current() reference',
					explanation:
						'current() is a reference to the context itself; results are contextualized to context, but the inverse is not the case',

					contextNodeset: 'whatever',
					expression: '/data[current() = 1]/bar',
					expected: [
						'/data/bar',
						'whatever', // shouldn't this be '/data/whatever'??
					],
				},
				{
					description: 'any context; predicate reference',
					explanation:
						'context is not pertinent here, reference in the Predicate is relative to the path Step where the Predicate occurs (and contextualized to it)',

					contextNodeset: 'whatever',
					expression: '/data[whatever = 1]/bar',
					expected: ['/data/bar', '/data/whatever'],
				},
			];

			describe.each(cases)(
				'$description',
				({ contextNodeset, explanation, expression, expected }) => {
					describe(explanation, () => {
						it(`resolves nodeset dependencies in expression ${JSON.stringify(expression)}, with context ${JSON.stringify(contextNodeset)}, producing nodesets: ${JSON.stringify(expected)}`, () => {
							const actual = resolveDependencyNodesets(contextNodeset, expression);

							expect(actual).toEqual(expected);
						});
					});
				}
			);

			describe('evaluation examples', () => {
				let fixture: XMLDocument;
				let evaluator: XFormsXPathEvaluator;
				let dataBarTarget: Element;
				let dataWhateverContext: Element;
				let dataFooWhateverContext: Element;

				beforeEach(() => {
					fixture = xml/* xml */ `
						<data>
							<foo>
								<whatever>2</whatever>
							</foo>
							<whatever>1</whatever>
							<bar>bar</bar>
						</data>
					`;

					evaluator = new XFormsXPathEvaluator({
						rootNode: fixture,
					});

					const dataBar = fixture.querySelector('bar');

					assert(dataBar != null);

					dataBarTarget = dataBar;

					const [dataFooWhatever, dataWhatever] = fixture.querySelectorAll('whatever');

					assert(dataFooWhatever);
					assert(dataWhatever);

					dataFooWhateverContext = dataFooWhatever;
					dataWhateverContext = dataWhatever;
				});

				it('evaluates with `current()` as a reference to the context node itself (where context is /data/whatever, value equal to 1)', () => {
					const evaluationOptions = { contextNode: dataWhateverContext };

					const currentEq1 = evaluator.evaluateBoolean('current() = 1', evaluationOptions);

					expect(currentEq1).toBe(true);

					const currentResult = evaluator.evaluateNode(
						'/data[current() = 1]/bar',
						evaluationOptions
					);

					expect(currentResult).toBe(dataBarTarget);
				});

				it('evaluates with `current()` as a reference to the context node itself (where context /data/foo/whatever, value equal to 2)', () => {
					const evaluationOptions = { contextNode: dataFooWhateverContext };

					const currentEq1 = evaluator.evaluateBoolean('current() = 1', evaluationOptions);

					expect(currentEq1).toBe(false);

					const currentResult = evaluator.evaluateNode(
						'/data[current() = 1]/bar',
						evaluationOptions
					);

					expect(currentResult).toBeNull();
				});

				it('evaluates Predicate NameTest relative to step (context is <whatever>2</whatever>, but `whatever` does not reference the context, it references /data/bar)', () => {
					const evaluationOptions = { contextNode: dataFooWhateverContext };

					const currentEq1 = evaluator.evaluateBoolean('current() = 1', evaluationOptions);

					expect(currentEq1).toBe(false);

					const currentResult = evaluator.evaluateNode(
						'/data[whatever = 1]/bar',
						evaluationOptions
					);

					expect(currentResult).toBe(dataBarTarget);
				});
			});
		});

		describe("2- I was assuming arguments to the functions would be added as dependencies and this would return '/bat' as well?", () => {
			it('resolves paths from an Argument to a FilterExpr at the start of another path', () => {
				const contextNodeset = null;
				const expression = 'foo("bar", /bat)/quux and zig()[zag]';
				const expected = ['foo("bar", /bat)/quux', '/bat', 'zig()', 'zig()/zag'];

				const actual = resolveDependencyNodesets(contextNodeset, expression);

				expect(actual).toEqual(expected);
			});
		});

		describe("3- Parent's sibling works when contextnode is absolute but not when it is relative", () => {
			const cases: readonly ExplainedCase[] = [
				{
					description:
						"Relative context, sibling path in expression (review feedback expected resolving 'bar' rather than 'foo/../bar'",
					explanation:
						'Context does not provide enough information to fully resolve expression. Intent of this partial resolution is that it may be resolved downstream, which may provide further (hopefully, eventually, absolute) context which can then fully resolve the still-relative dependencies. This may require some followup work to revisit those still-relative dependencies, but the logic is in place to progressively resolve context paths as form parsing progresses. In theory, this is probably safe to resolve further because the result would preserve the hierarchical implications, but it feels safer now to start with this more conservative incomplete result.',

					contextNodeset: 'foo',
					expression: '../bar',
					expected: ['foo/../bar'],
				},
				{
					description: 'Absolute context, sibling path in expression',
					explanation:
						'Context provides enough information to fully resolve the sibling path sub-expression, so it is fully resolved.',

					contextNodeset: '/foo',
					expression: '../bar',
					expected: ['/bar'],
				},
			];

			describe.each(cases)(
				'$description',
				({ contextNodeset, explanation, expression, expected }) => {
					describe(explanation, () => {
						it(`resolves nodeset dependencies in expression ${JSON.stringify(expression)}, with context ${JSON.stringify(contextNodeset)}, producing nodesets: ${JSON.stringify(expected)}`, () => {
							const actual = resolveDependencyNodesets(contextNodeset, expression);

							expect(actual).toEqual(expected);
						});
					});
				}
			);
		});

		describe('4- How are we handling text()? I am thinking parent of the text node (i.e. the element node) should be added to the dependencies', () => {
			// TODO! This is an enhancement opportunity. I did a timeboxed spike into
			// a solution, but found it would require intrusive rework to prevent
			// breaking at least one related edge case. This may be worth doing in the
			// fullness of time, but it's a pretty unlikely case in practice (as are
			// the several additional cases below, all included to capture the general
			// set of expectations if we do prioritize this).
			it.fails(
				'should resolve the containing element as a dependency, when a path sub-expression would reference its non-element children',
				() => {
					const contextNodeset = '/data/foo';
					const expression = 'child::text()';
					const expected = ['/data/foo'];

					const actual = resolveDependencyNodesets(contextNodeset, expression);

					expect(actual).toEqual(expected);
				}
			);

			const additionalCases: readonly ResolveDependencyNodesetsCase[] = [
				{
					description: 'text() is equivalent to child::text()',

					contextNodeset: '/data/foo',
					expression: 'text()',
					expected: ['/data/foo'],
				},
				{
					description:
						'child::comment() or comment(), though unlikely in practice, also resolved to parent of that NodeTest',

					contextNodeset: '/data/foo',
					expression: 'bar/child::comment()',
					expected: ['/data/foo/bar'],
				},
				{
					description:
						'child::processing-instruction() or processing-instruction(), though unlikely in practice, also resolved to parent of that NodeTest',

					contextNodeset: '/data/foo',
					expression: './bat/child::processing-instruction() + bat/processing-instruction()',
					expected: ['/data/foo/bat'],
				},
				{
					description:
						'child::processing-instruction("name") or processing-instruction("name"), though unlikely in practice, also resolved to parent of that NodeTest',

					contextNodeset: '/data/foo',
					expression:
						'/data/quux/child::processing-instruction("name") div ../quux/processing-instruction("name")',
					expected: ['/data/quux'],
				},
			];

			describe.each<ResolveDependencyNodesetsCase>(additionalCases)(
				'$description',
				({ contextNodeset, expression, expected }) => {
					it.fails(
						`resolves nodeset dependencies in expression ${JSON.stringify(expression)}, with context ${JSON.stringify(contextNodeset)}, producing nodesets: ${JSON.stringify(expected)}`,
						() => {
							const actual = resolveDependencyNodesets(contextNodeset, expression);

							expect(actual).toEqual(expected);
						}
					);
				}
			);

			describe('child::node() may match an element, so it is not safe to omit', () => {
				it('preserves Step with child::node() NodeTest', () => {
					const contextNodeset = '/data/foo';
					const expression = 'child::node()';
					const expected = ['/data/foo/child::node()'];
					const actual = resolveDependencyNodesets(contextNodeset, expression);

					expect(actual).toEqual(expected);
				});

				// This normalization could go either way, failing here just captures
				// the expectation that we'd normalize equivalent NodeTest cases if/when
				// we handle them more broadly.
				it.fails('normalizes Step with node() NodeTest to child::node()', () => {
					const contextNodeset = '/data/foo';
					const expression = 'node()';
					const expected = ['/data/foo/child::node()'];
					const actual = resolveDependencyNodesets(contextNodeset, expression);

					expect(actual).toEqual(expected);
				});
			});
		});

		describe("5- Shouldn't this be an error? A text node can't have children, right?", () => {
			const cases: readonly ExplainedCase[] = [
				{
					description:
						'Context terminates at a NodeTest for a text node, expression is a relative child NodeTest',

					explanation: `
This is subjective! The intent of the functionality under test is focused on applying a subset of known XPath semantics _at the syntactic level_.

Responding directly to the question: it's true that the resulting expression cannot ever reach a node. It represents a structure that isn't possible to create with the underlying XML semantics. However, the result correctly represents the traversal that would be performed by evaluating the specified \`expression\` with a context node matching the specified \`contextNodeset\`.

Importantly:

1. The result **is syntactically valid**.
2. Evaluation will simply produce an empty node-set.

In theory, it could definitely make sense to produce a warning to at least some users (when we have the functionality to support that). If we do that, I would expect warning to happen somewhere downstream from here. Although that could suggest a result structure that carries more information than the resolved expression serialized as a string, e.g. to capture any observation of the nonsensical structure during analysis and then have consuming code capable of warning based on that information.
`.trim(),

					contextNodeset: '/data/child::text()',
					expression: 'child::node()',
					expected: ['/data/child::text()/child::node()'],
				},
			];

			describe.each(cases)(
				'$description',
				({ contextNodeset, explanation, expression, expected }) => {
					describe(explanation, () => {
						it(`resolves nodeset dependencies in expression ${JSON.stringify(expression)}, with context ${JSON.stringify(contextNodeset)}, producing nodesets: ${JSON.stringify(expected)}`, () => {
							const actual = resolveDependencyNodesets(contextNodeset, expression);

							expect(actual).toEqual(expected);
						});
					});
				}
			);
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
