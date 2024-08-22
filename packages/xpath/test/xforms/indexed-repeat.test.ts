import {
	body,
	group,
	head,
	html,
	input,
	mainInstance,
	model,
	repeat,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { beforeEach, describe, it } from 'vitest';
import type { indexedRepeat } from '../../src/functions/xforms/node-set.ts';
import type { TestContext } from '../helpers.ts';
import { createXFormsTestContext } from '../helpers.ts';

describe('indexed-repeat(...)', () => {
	let testContext: TestContext;

	interface IndexedRepeatArgsDepth1 {
		readonly target: string;
		readonly repeat1: string;
		readonly index1: string;
		readonly repeat2?: never;
		readonly index2?: never;
		readonly repeat3?: never;
		readonly index3?: never;
	}

	interface IndexedRepeatArgsDepth2 {
		readonly target: string;
		readonly repeat1: string;
		readonly index1: string;
		readonly repeat2: string;
		readonly index2: string;
		readonly repeat3?: never;
		readonly index3?: never;
	}

	interface IndexedRepeatArgsDepth3 {
		readonly target: string;
		readonly repeat1: string;
		readonly index1: string;
		readonly repeat2: string;
		readonly index2: string;
		readonly repeat3: string;
		readonly index3: string;
	}

	// prettier-ignore
	type IndexedRepeatArgs =
		| IndexedRepeatArgsDepth1
		| IndexedRepeatArgsDepth2
		| IndexedRepeatArgsDepth3;

	interface IndexedRepeatParameterCase {
		readonly description: string;
		readonly parameters: IndexedRepeatArgs;
	}

	describe('depth: 1', () => {
		describe('partially derived from JavaRosa/scenario', () => {
			const ABSOLUTE_TARGET = '/data/some-group/item/value';
			const RELATIVE_TARGET = '../item/value';
			const ABSOLUTE_GROUP = '/data/some-group/item';
			const RELATIVE_GROUP = '../item';
			const ABSOLUTE_INDEX = '/data/pos';
			const RELATIVE_INDEX = '../../pos';

			const cases: readonly IndexedRepeatParameterCase[] = [
				{
					description: 'Target: absolute, group: absolute, index: absolute',
					parameters: {
						target: ABSOLUTE_TARGET,
						repeat1: ABSOLUTE_GROUP,
						index1: ABSOLUTE_INDEX,
					},
				},
				{
					description: 'Target: absolute, group: absolute, index: relative',
					parameters: {
						target: ABSOLUTE_TARGET,
						repeat1: ABSOLUTE_GROUP,
						index1: RELATIVE_INDEX,
					},
				},
				{
					description: 'Target: absolute, group: relative, index: absolute',
					parameters: {
						target: ABSOLUTE_TARGET,
						repeat1: RELATIVE_GROUP,
						index1: ABSOLUTE_INDEX,
					},
				},
				{
					description: 'Target: absolute, group: relative, index: relative',
					parameters: {
						target: ABSOLUTE_TARGET,
						repeat1: RELATIVE_GROUP,
						index1: RELATIVE_INDEX,
					},
				},
				{
					description: 'Target: relative, group: absolute, index: absolute',
					parameters: {
						target: RELATIVE_TARGET,
						repeat1: ABSOLUTE_GROUP,
						index1: ABSOLUTE_INDEX,
					},
				},
				{
					description: 'Target: relative, group: absolute, index: relative',
					parameters: {
						target: RELATIVE_TARGET,
						repeat1: ABSOLUTE_GROUP,
						index1: RELATIVE_INDEX,
					},
				},
				{
					description: 'Target: relative, group: relative, index: absolute',
					parameters: {
						target: RELATIVE_TARGET,
						repeat1: RELATIVE_GROUP,
						index1: ABSOLUTE_INDEX,
					},
				},
				{
					description: 'Target: relative, group: relative, index: relative',
					parameters: {
						target: RELATIVE_TARGET,
						repeat1: RELATIVE_GROUP,
						index1: RELATIVE_INDEX,
					},
				},
			];

			describe.each(cases)('$description', ({ parameters }) => {
				const randomUInt = (max: number): number => {
					return Math.floor(Math.random() * max);
				};

				const itemsCount = randomUInt(10) + 1;
				const values = Array(itemsCount)
					.fill(null)
					.map((_, i) => {
						return Math.random() * i * 10;
					});
				const index = randomUInt(itemsCount);
				const expected = values[index]!;
				const position = index + 1;
				const { target, repeat1, index1, repeat2, index2, repeat3, index3 } = parameters;
				const args = [target, repeat1, index1];

				if (repeat2 != null) {
					args.push(repeat2, index2);
				}

				if (repeat3 != null) {
					args.push(repeat3, index3);
				}

				const expression = `indexed-repeat(${args.join(', ')})`;

				beforeEach(() => {
					const items = values.map((value) => {
						return t('item', t('value', `${value}`));
					});

					const xml = html(
						head(
							title('indexed-repeat form'),
							model(
								mainInstance(
									t(
										'data id="indexed-repeat-form"',
										t('some-group', ...items, t('ctx')),
										t('pos', `${position}`)
									)
								)
							)
						),
						body(
							group(
								'/data/some-group',
								group(
									'/data/some-group/item',
									repeat('/data/some-group/item', input('/data/some-group/item/value'))
								)
							)
						)
					).asXml();

					testContext = createXFormsTestContext(xml, {
						getRootNode: (doc) => doc.querySelector('instance')!,
					});
				});

				it(`evaluates ${expression} to ${expected}`, () => {
					const contextNode = testContext.document.querySelector('ctx');

					testContext.assertNumberValue(expression, expected, { contextNode });
				});

				const explicitPositionArgumentCases = values.map((value, i) => {
					const explicitPosition = i + 1;
					const explicitPositionExpression = `indexed-repeat(${target}, ${repeat1}, ${explicitPosition})`;

					return {
						explicitPositionExpression,
						value,
					};
				});

				it.each(explicitPositionArgumentCases)(
					'evaluates $explicitPositionExpression to $value',
					({ explicitPositionExpression, value }) => {
						const contextNode = testContext.document.querySelector('ctx');

						testContext.assertNumberValue(explicitPositionExpression, value, { contextNode });
					}
				);
			});
		});
	});

	describe('depth: up to 3', () => {
		beforeEach(() => {
			// prettier-ignore
			const xml = html(
				head(
					title('indexed-repeat form'),
					model(
						mainInstance(
							t('data id="indexed-repeat-form"',
								t('d0pos1', '1'),
								t('d0pos2', '2'),
								t('d0pos3', '3'),

								t('d1',
									t('v', '1'),
									t('d2',
										t('v', '1.1'),
										t('d3',
											t('v', '1.1.1')),
										t('d3',
											t('v', '1.1.2')),
										t('d3',
											t('v', '1.1.3'))),
									t('d2',
										t('v', '1.2'),
										t('d3',
											t('v', '1.2.1')),
										t('d3',
											t('v', '1.2.2')),
										t('d3',
											t('v', '1.2.3')))),
								t('d1',
									t('v', '2'),
									t('d2',
										t('v', '2.1'),
										t('d3',
											t('v', '2.1.1')),
										t('d3',
											t('v', '2.1.2')),
										t('d3',
											t('v', '2.1.3'))),
									t('d2',
										t('v', '2.2'),
										t('d3',
											t('v', '2.2.1')),
										t('d3',
											t('v', '2.2.2')),
										t('d3',
											t('v', '2.2.3')))))))),
				body(
					repeat('/data/d1',
						input('/data/d1/v'),
						repeat('/data/d1/d2',
							input('/data/d1/d2/v'),
								repeat('/data/d1/d2/d3',
									input('/data/d1/d2/d3/v')))))
			).asXml();

			testContext = createXFormsTestContext(xml, {
				getRootNode: (doc) => doc.querySelector('instance')!,
			});
		});

		interface DepthCase {
			readonly expression: string;
			readonly expected: string;
		}

		const absoluteDepth2Arg = (baseExpression: string) => {
			return baseExpression.replace(/, \.\/d2,/, ', /data/d1/d2,');
		};

		const absoluteDepth3Arg = (baseExpression: string) => {
			return baseExpression.replace(/, \.\/d3,/, ', /data/d1/d2/d3,');
		};

		const absoluteDepthArgs = (baseExpression: string) => {
			return absoluteDepth3Arg(absoluteDepth2Arg(baseExpression));
		};

		/**
		 * @todo while these represent a pretty large matrix of possible cases, it
		 * could be more thorough still. Among the things not tested:
		 *
		 * - A wide variety of context-dependent position arguments. Omitting these
		 *   cases, for now, is meant as an opportunity to discuss intent.
		 *   {@link indexedRepeat} goes into more detail about the ambiguities we
		 *   might want to discuss.
		 *
		 * - Varying initial context, with relative expressions at depth 1. This
		 *   doesn't feel particularly important to test: it's partially tested in
		 *   the above tests derived from JavaRosa; if it is broken, a lot of other
		 *   things will be too. That said, it could instill a bit more confidence
		 *   to chain `indexed-repeat` calls from prior `indexed-repeat` results.
		 *
		 * - Most type coercion cases are covered for positions, but coercion from
		 *   boolean felt silly to address directly. There's no specific coercion
		 *   logic in the `indexed-repeat` implementation, and it would be
		 *   concerning if there ever is.
		 */
		const cases: readonly DepthCase[] = [
			// Depth 1, numeric position
			{
				expression: 'indexed-repeat(./v, /data/d1, 1)',
				expected: '1',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 2)',
				expected: '2',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 3)',
				expected: '',
			},

			// Depth 1, absolute node-set position
			{
				expression: 'indexed-repeat(./v, /data/d1, /data/d0pos1)',
				expected: '1',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, /data/d0pos2)',
				expected: '2',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, /data/d0pos3)',
				expected: '',
			},

			// Depth 2, relative to depth 1, numeric position
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, 1)',
				expected: '1.1',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, 2)',
				expected: '1.2',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, 3)',
				expected: '',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 2, ./d2, 2)',
				expected: '2.2',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 2, ./d2, 3)',
				expected: '',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 3, ./d2, 2)',
				expected: '',
			},

			// Depth 2, mixed numeric string/absolute node-set positions
			{
				expression: 'indexed-repeat(./v, /data/d1, "1", ./d2, /data/d0pos1)',
				expected: '1.1',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, /data/d0pos1, ./d2, "2")',
				expected: '1.2',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, "1", ./d2, /data/d0pos3)',
				expected: '',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, /data/d0pos2, ./d2, "2")',
				expected: '2.2',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, "2", ./d2, /data/d0pos3)',
				expected: '',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, /data/d0pos3, ./d2, "2")',
				expected: '',
			},

			// Depth 3, relative depth2+, numeric positions
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, 1, ./d3, 1)',
				expected: '1.1.1',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, 1, ./d3, 2)',
				expected: '1.1.2',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, 1, ./d3, 3)',
				expected: '1.1.3',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, 1, ./d3, 4)',
				expected: '',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, 2, ./d3, 2)',
				expected: '1.2.2',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, 2, ./d3, 4)',
				expected: '',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 2, ./d2, 1, ./d3, 3)',
				expected: '2.1.3',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 3, ./d2, 1, ./d3, 2)',
				expected: '',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, 3, ./d3, 1)',
				expected: '',
			},

			// Depth 3, relative depth2+, mixed number/numeric string/absolute node-set positions
			{
				expression: 'indexed-repeat(./v, /data/d1, /data/d0pos1, ./d2, "1", ./d3, 1)',
				expected: '1.1.1',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, /data/d0pos1, ./d3, "2")',
				expected: '1.1.2',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 1, ./d2, "1", ./d3, /data/d0pos3)',
				expected: '1.1.3',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, /data/d0pos1, ./d2, "1", ./d3, /data/d0pos4)',
				expected: '',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, "1", ./d2, /data/d0pos2, ./d3, /data/d0pos2)',
				expected: '1.2.2',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, /data/d0pos1, ./d2, /data/d0pos2, ./d3, "4")',
				expected: '',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, /data/d0pos2, ./d2, 1, ./d3, "3")',
				expected: '2.1.3',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, 3, ./d2, /data/d0pos1, ./d3, "2")',
				expected: '',
			},
			{
				expression: 'indexed-repeat(./v, /data/d1, "1", ./d2, 3, ./d3, /data/d0pos1)',
				expected: '',
			},
		].flatMap((baseCase) => {
			const { expression: baseExpression, expected } = baseCase;

			const expressions = [
				baseExpression,
				absoluteDepth2Arg(baseExpression),
				absoluteDepth3Arg(baseExpression),
				absoluteDepthArgs(baseExpression),
			];

			return expressions.map((expression) => ({
				expression,
				expected,
			}));
		});

		it.each(cases)('evaluates $expression to $expected', ({ expression, expected }) => {
			const contextNode = testContext.evaluator.evaluateNonNullElement('/data');

			testContext.assertStringValue(expression, expected, { contextNode });
		});
	});
});
