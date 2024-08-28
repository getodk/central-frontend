import {
	bind,
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
import { assert, beforeEach, describe, expect, it } from 'vitest';
import { intAnswer } from '../../../src/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../../../src/answer/ExpectedStringAnswer.ts';
import { Scenario } from '../../../src/jr/Scenario.ts';

describe('Tests ported from JavaRosa', () => {
	describe('IndexedRepeatRelativeRefsTest.java', () => {
		const ABSOLUTE_TARGET = '/data/some-group/item/value';
		const RELATIVE_TARGET = '../item/value';
		const ABSOLUTE_GROUP = '/data/some-group/item';
		const RELATIVE_GROUP = '../item';
		const ABSOLUTE_INDEX = '/data/total-items';
		const RELATIVE_INDEX = '../../total-items';

		interface IndexedRepeatRelativeRefsOptions {
			readonly testName: string;
			readonly target: string;
			readonly group: string;
			readonly index: string;
		}

		const parameters: readonly IndexedRepeatRelativeRefsOptions[] = [
			{
				testName: 'Target: absolute, group: absolute, index: absolute',
				target: ABSOLUTE_TARGET,
				group: ABSOLUTE_GROUP,
				index: ABSOLUTE_INDEX,
			},
			{
				testName: 'Target: absolute, group: absolute, index: relative',
				target: ABSOLUTE_TARGET,
				group: ABSOLUTE_GROUP,
				index: RELATIVE_INDEX,
			},
			{
				testName: 'Target: absolute, group: relative, index: absolute',
				target: ABSOLUTE_TARGET,
				group: RELATIVE_GROUP,
				index: ABSOLUTE_INDEX,
			},
			{
				testName: 'Target: absolute, group: relative, index: relative',
				target: ABSOLUTE_TARGET,
				group: RELATIVE_GROUP,
				index: RELATIVE_INDEX,
			},
			{
				testName: 'Target: relative, group: absolute, index: absolute',
				target: RELATIVE_TARGET,
				group: ABSOLUTE_GROUP,
				index: ABSOLUTE_INDEX,
			},
			{
				testName: 'Target: relative, group: absolute, index: relative',
				target: RELATIVE_TARGET,
				group: ABSOLUTE_GROUP,
				index: RELATIVE_INDEX,
			},
			{
				testName: 'Target: relative, group: relative, index: absolute',
				target: RELATIVE_TARGET,
				group: RELATIVE_GROUP,
				index: ABSOLUTE_INDEX,
			},
			{
				testName: 'Target: relative, group: relative, index: relative',
				target: RELATIVE_TARGET,
				group: RELATIVE_GROUP,
				index: RELATIVE_INDEX,
			},
		];

		/**
		 * **PORTING NOTES**
		 *
		 * - Fails pending implementation of `indexed-repeat` XPath function.
		 *
		 * - Parameters adapted to match values in JavaRosa. Note that the
		 *   parameters are passed as {@link options} rather than destructured. Java
		 *   lets you reference `group` (the class property) and `group` (the
		 *   imported static method) in the same scope. TypeScript/JavaScript don't
		 *   let you do that... which is fine, because doing that is really weird!
		 *
		 * - Includes proposed explicit repeat creation.
		 *
		 * - `answer` calls updated to omit superfluous position predicate on
		 *   the non-repeat `some-group` step (we do this lookup by `reference`,
		 *   not evaluating arbitrary XPath expressions to identify the question
		 *   being answered).
		 */
		it.each<IndexedRepeatRelativeRefsOptions>(parameters)('$testName', async (options) => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(
								t(
									'data id="some-form"',
									t('some-group', t('item jr:template=""', t('value')), t('last-value')),
									t('total-items')
								)
							),
							bind(ABSOLUTE_TARGET).type('int'),
							bind('/data/total-items').type('int').calculate('count(/data/some-group/item)'),
							bind('/data/some-group/last-value')
								.type('int')
								.calculate(
									'indexed-repeat(' +
										options.target +
										', ' +
										options.group +
										', ' +
										options.index +
										')'
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
				)
			);

			scenario.proposed_addExplicitCreateNewRepeatCallHere('/data/some-group/item', {
				explicitRepeatCreation: true,
			});
			// scenario.answer('/data/some-group[1]/item[1]/value', 11);
			scenario.answer('/data/some-group/item[1]/value', 11);

			scenario.proposed_addExplicitCreateNewRepeatCallHere('/data/some-group/item', {
				explicitRepeatCreation: true,
			});
			// scenario.answer('/data/some-group[1]/item[2]/value', 22);
			scenario.answer('/data/some-group/item[2]/value', 22);

			scenario.proposed_addExplicitCreateNewRepeatCallHere('/data/some-group/item', {
				explicitRepeatCreation: true,
			});
			// scenario.answer('/data/some-group[1]/item[3]/value', 33);
			scenario.answer('/data/some-group/item[3]/value', 33);

			expect(scenario.answerOf('/data/total-items')).toEqualAnswer(intAnswer(3));
			expect(scenario.answerOf('/data/some-group/last-value')).toEqualAnswer(intAnswer(33));
		});
	});

	// https://github.com/getodk/javarosa/pull/776
	describe('JavaRosa draft PR: "Add indexed-repeat tests"', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * - Test is ported to use a more general error check, and assertion
		 *   messaging is updated accordingly. Error message is asserted **not to
		 *   be** the error thrown by `@getodk/xpath` for missing function support,
		 *   so we start with an expected failure throughout the suite.
		 *
		 * - Bind for `calc` is updated to reference `/data/calc`, as is clearly
		 *   intended in the original draft PR.
		 *
		 * - Failure is due to function implementation in `@getodk/xpath`, which has
		 *   little if any concept of repeats or what "is" a repeat. Unclear if this
		 *   failure is meaningful for users, or if the test is mostly demonstrating
		 *   that aspect of JavaRosa implementation detail.
		 *
		 * JR: firstArgNotChildOfRepeat_throwsException
		 */
		describe('first argument not child of a repeat', () => {
			it.fails('produces an error', async () => {
				let caught: unknown;

				try {
					// prettier-ignore
					await Scenario.init('indexed-repeat', html(
						head(
							title('indexed-repeat'),
							model(
								mainInstance(t('data id="indexed-repeat"',
									t('outside'),
									t('repeat',
										t('inside')),
									t('calc')
								)),
								bind('/data/calc')
									.calculate('indexed-repeat(/data/outside, /data/repeat, 1)')
							)
						),
						body(
							input('/data/outside'),
							repeat('/data/repeat',
								input('/data/repeat/inside'))
						))
					);
				} catch (error) {
					caught = error;
				}

				assert(caught instanceof Error);
				expect(caught.message).not.toContain('function not defined: indexed-repeat');
			});
		});

		/**
		 * **PORTING NOTES**
		 *
		 * - Removes superfluous position predicates on `outer_group`.
		 *
		 * JR: getsIndexedValueInSingleRepeat
		 */
		it('gets an indexed value in a single repeat instance', async () => {
			// prettier-ignore
			const scenario = await Scenario.init('indexed-repeat', html(
				head(
					title('indexed-repeat'),
					model(
						mainInstance(t('data id="indexed-repeat"',
							t('index'),
							t('outer_group', // included to clarify intended evaluation context for index references
								t('repeat',
									t('inside'))),
							t('calc')
						)),
						bind('/data/calc').calculate('indexed-repeat(/data/outer_group/repeat/inside, /data/outer_group/repeat, ../index)')
					)
				),
				body(
					input('/data/index'),
					group('/data/outer_group',
						repeat('/data/outer_group/repeat',
							input('/data/outer_group/repeat/inside')))
				))
			);

			// scenario.createNewRepeat('/data/outer_group[1]/repeat');
			scenario.createNewRepeat('/data/outer_group/repeat');
			// scenario.answer('/data/outer_group[1]/repeat[1]/inside', 'index1');
			scenario.answer('/data/outer_group/repeat[1]/inside', 'index1');

			// scenario.createNewRepeat('/data/outer_group[1]/repeat');
			scenario.createNewRepeat('/data/outer_group/repeat');
			// scenario.answer('/data/outer_group[1]/repeat[2]/inside', 'index2');
			scenario.answer('/data/outer_group/repeat[2]/inside', 'index2');

			// scenario.createNewRepeat('/data/outer_group[1]/repeat');
			scenario.createNewRepeat('/data/outer_group/repeat');
			// scenario.answer('/data/outer_group[1]/repeat[3]/inside', 'index3');
			scenario.answer('/data/outer_group/repeat[3]/inside', 'index3');

			scenario.answer('/data/index', '2');

			expect(scenario.answerOf('/data/calc')).toEqualAnswer(stringAnswer('index2'));

			scenario.answer('/data/index', '1');

			expect(scenario.answerOf('/data/calc')).toEqualAnswer(stringAnswer('index1'));
		});

		/**
		 * **PORTING NOTES**
		 *
		 * - Updated body reference to `/data/repeat2/inside2`, as seems the likely
		 *   intent for that input. (`xforms-engine` otherwise fails to parse the
		 *   form when it encounters an input with the same reference as its parent
		 *   repeat element)
		 *
		 * JR: getsIndexedValueUsingParallelRepeatPosition
		 */
		it('gets an indexed value using parallel repeat position', async () => {
			// prettier-ignore
			const scenario = await Scenario.init('indexed-repeat', html(
				head(
					title('indexed-repeat'),
					model(
						mainInstance(
							t('data id="indexed-repeat"',
								t('repeat1',
									t('inside1')),

								t('repeat2',
									t('inside2'),
									t('from_repeat1'))
							)
						),

						bind('/data/repeat2/from_repeat1')
							.calculate('indexed-repeat(/data/repeat1/inside1, /data/repeat1, position(..))')
					)
				),
				body(
					repeat('/data/repeat1',
						input('/data/repeat1/inside1')),

					repeat('/data/repeat2',
						input('/data/repeat2/inside2'))
				))
			);

			scenario.createNewRepeat('/data/repeat1');
			scenario.createNewRepeat('/data/repeat2');
			scenario.answer('/data/repeat1[1]/inside1', 'index1');

			scenario.createNewRepeat('/data/repeat1');
			scenario.createNewRepeat('/data/repeat2');
			scenario.answer('/data/repeat1[2]/inside1', 'index2');

			scenario.createNewRepeat('/data/repeat1');
			scenario.createNewRepeat('/data/repeat2');
			scenario.answer('/data/repeat1[3]/inside1', 'index3');

			expect(scenario.answerOf('/data/repeat2[1]/from_repeat1')).toEqualAnswer(
				stringAnswer('index1')
			);
			expect(scenario.answerOf('/data/repeat2[2]/from_repeat1')).toEqualAnswer(
				stringAnswer('index2')
			);
		});
	});
});

describe('Nested repeats', () => {
	let scenario: Scenario;

	beforeEach(async () => {
		// prettier-ignore
		scenario = await Scenario.init('indexed-repeat', html(
			head(
				title('indexed-repeat'),
				model(
					mainInstance(t('data id="indexed-repeat"',
						t('r1-d1 jr:template=""',
							t('inside-r1-d1'),
							t('r1-d2 jr:template=""',
								t('inside-r1-d2'),
								t('r1-d3 jr:template=""',
									t('inside-r1-d3')))),

						t('r2-d1 jr:template=""',
							t('inside-r2-d1'),
							t('from-r1-d1'),
							t('r2-d2 jr:template=""',
								t('inside-r2-d2'),
								t('from-r1-d2-a'),
								t('from-r1-d2-b'),
								t('r2-d3 jr:template=""',
									t('inside-r2-d3'),
									t('from-r1-d3-a'),
									t('from-r1-d3-b'))))
					)),
					bind('/data/r1-d1/inside-r1-d1')
						.calculate("concat('[', position(..), ']')"),
					bind('/data/r1-d1/r1-d2/inside-r1-d2')
						.calculate("concat('[', position(../..), ']', '[', position(..), ']')"),
					bind('/data/r1-d1/r1-d2/r1-d3/inside-r1-d3')
						.calculate("concat('[', position(../../..), ']', '[', position(../..), ']', '[', position(..), ']')"),
					bind('/data/r2-d1/from-r1-d1')
						.calculate('indexed-repeat(/data/r1-d1/inside-r1-d1, /data/r1-d1, position(..))'),
					bind('/data/r2-d1/r2-d2/from-r1-d2-a')
						.calculate('indexed-repeat(/data/r1-d1/r1-d2/inside-r1-d2, /data/r1-d1, position(../..), /data/r1-d1/r1-d2, position(..))'),
					bind('/data/r2-d1/r2-d2/from-r1-d2-b')
						// Same as from-r1-d2-a with the repeatN/indexN pairs swapped
						.calculate('indexed-repeat(/data/r1-d1/r1-d2/inside-r1-d2, /data/r1-d1/r1-d2, position(..), /data/r1-d1, position(../..))'),
					bind('/data/r2-d1/r2-d2/r2-d3/from-r1-d3-a')
						.calculate('indexed-repeat(/data/r1-d1/r1-d2/r1-d3/inside-r1-d3, /data/r1-d1, position(../../..), /data/r1-d1/r1-d2, position(../..), /data/r1-d1/r1-d2/r1-d3, position(..))'),
					bind('/data/r2-d1/r2-d2/r2-d3/from-r1-d3-b')
					// Same as from-r1-d3-a with the repeatN/indexN pairs reordered
						.calculate('indexed-repeat(/data/r1-d1/r1-d2/r1-d3/inside-r1-d3, /data/r1-d1/r1-d2, position(../..), /data/r1-d1, position(../../..), /data/r1-d1/r1-d2/r1-d3, position(..))')
				)
		),
		body(
			repeat('/data/r1-d1',
				input('/data/r1-d1/inside-r1-d1'),
				repeat('/data/r1-d1/r1-d2',
					input('/data/r1-d1/r1-d2/inside-r1-d2'),
					repeat('/data/r1-d1/r1-d2/r1-d3',
						input('/data/r1-d1/r1-d2/r1-d3/inside-r1-d3')))),

				repeat('/data/r2-d1',
					input('/data/r2-d1/inside-r2-d1'),
					repeat('/data/r2-d1/r2-d2',
						input('/data/r2-d1/r2-d2/inside-r2-d2'),
						repeat('/data/r2-d1/r2-d2/r2-d3',
							input('/data/r2-d1/r2-d2/r2-d3/inside-r2-d3'))))
		)));

		// Create two r1-d1
		scenario.createNewRepeat('/data/r1-d1');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[1]');
		scenario.createNewRepeat('/data/r1-d1');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[2]');

		// For each r1-d1, create two r1-d2
		scenario.createNewRepeat('/data/r1-d1[1]/r1-d2');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[1]/r1-d2[1]');
		scenario.createNewRepeat('/data/r1-d1[1]/r1-d2');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[1]/r1-d2[2]');

		scenario.createNewRepeat('/data/r1-d1[2]/r1-d2');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[2]/r1-d2[1]');
		scenario.createNewRepeat('/data/r1-d1[2]/r1-d2');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[2]/r1-d2[2]');

		// For each r1-d2, create two r1-d3
		scenario.createNewRepeat('/data/r1-d1[1]/r1-d2[1]/r1-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[1]/r1-d2[1]/r1-d3[1]');
		scenario.createNewRepeat('/data/r1-d1[1]/r1-d2[1]/r1-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[1]/r1-d2[1]/r1-d3[2]');

		scenario.createNewRepeat('/data/r1-d1[1]/r1-d2[2]/r1-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[1]/r1-d2[2]/r1-d3[1]');
		scenario.createNewRepeat('/data/r1-d1[1]/r1-d2[2]/r1-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[1]/r1-d2[2]/r1-d3[2]');

		scenario.createNewRepeat('/data/r1-d1[2]/r1-d2[1]/r1-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[2]/r1-d2[1]/r1-d3[1]');
		scenario.createNewRepeat('/data/r1-d1[2]/r1-d2[1]/r1-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[2]/r1-d2[1]/r1-d3[2]');

		scenario.createNewRepeat('/data/r1-d1[2]/r1-d2[2]/r1-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[2]/r1-d2[2]/r1-d3[1]');
		scenario.createNewRepeat('/data/r1-d1[2]/r1-d2[2]/r1-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r1-d1[2]/r1-d2[2]/r1-d3[2]');

		// Create two r2-d1
		scenario.createNewRepeat('/data/r2-d1');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[1]');
		scenario.createNewRepeat('/data/r2-d1');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[2]');

		// For each r2-d1, create two r1-d2
		scenario.createNewRepeat('/data/r2-d1[1]/r2-d2');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[1]/r2-d2[1]');
		scenario.createNewRepeat('/data/r2-d1[1]/r2-d2');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[1]/r2-d2[2]');

		scenario.createNewRepeat('/data/r2-d1[2]/r2-d2');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[2]/r2-d2[1]');
		scenario.createNewRepeat('/data/r2-d1[2]/r2-d2');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[2]/r2-d2[2]');

		// For each r2-d2, create two r2-d3
		scenario.createNewRepeat('/data/r2-d1[1]/r2-d2[1]/r2-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[1]/r2-d2[1]/r2-d3[1]');
		scenario.createNewRepeat('/data/r2-d1[1]/r2-d2[1]/r2-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[1]/r2-d2[1]/r2-d3[2]');

		scenario.createNewRepeat('/data/r2-d1[1]/r2-d2[2]/r2-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[1]/r2-d2[2]/r2-d3[1]');
		scenario.createNewRepeat('/data/r2-d1[1]/r2-d2[2]/r2-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[1]/r2-d2[2]/r2-d3[2]');

		scenario.createNewRepeat('/data/r2-d1[2]/r2-d2[1]/r2-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[2]/r2-d2[1]/r2-d3[1]');
		scenario.createNewRepeat('/data/r2-d1[2]/r2-d2[1]/r2-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[2]/r2-d2[1]/r2-d3[2]');

		scenario.createNewRepeat('/data/r2-d1[2]/r2-d2[2]/r2-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[2]/r2-d2[2]/r2-d3[1]');
		scenario.createNewRepeat('/data/r2-d1[2]/r2-d2[2]/r2-d3');
		expect(scenario.refAtIndex().xpathReference).toBe('/data/r2-d1[2]/r2-d2[2]/r2-d3[2]');
	});

	it('handles top-level repeats', () => {
		expect(scenario.answerOf('/data/r2-d1[1]/from-r1-d1')).toEqualAnswer(stringAnswer('[1]'));
		expect(scenario.answerOf('/data/r2-d1[2]/from-r1-d1')).toEqualAnswer(stringAnswer('[2]'));
	});

	it.each([{ calculatedField: 'from-r1-d2-a' }, { calculatedField: 'from-r1-d2-b' }])(
		'handles repeats two deep (field: $calculatedField)',
		({ calculatedField }) => {
			expect(scenario.answerOf(`/data/r2-d1[1]/r2-d2[1]/${calculatedField}`)).toEqualAnswer(
				stringAnswer('[1][1]')
			);
			expect(scenario.answerOf(`/data/r2-d1[1]/r2-d2[2]/${calculatedField}`)).toEqualAnswer(
				stringAnswer('[1][2]')
			);
			expect(scenario.answerOf(`/data/r2-d1[2]/r2-d2[1]/${calculatedField}`)).toEqualAnswer(
				stringAnswer('[2][1]')
			);
			expect(scenario.answerOf(`/data/r2-d1[2]/r2-d2[2]/${calculatedField}`)).toEqualAnswer(
				stringAnswer('[2][2]')
			);
		}
	);

	it.each([{ calculatedField: 'from-r1-d3-a' }, { calculatedField: 'from-r1-d3-b' }])(
		'handles repeats three deep (field: $calculatedField)',
		({ calculatedField }) => {
			expect(
				scenario.answerOf(`/data/r2-d1[1]/r2-d2[1]/r2-d3[1]/${calculatedField}`)
			).toEqualAnswer(stringAnswer('[1][1][1]'));
			expect(
				scenario.answerOf(`/data/r2-d1[1]/r2-d2[1]/r2-d3[2]/${calculatedField}`)
			).toEqualAnswer(stringAnswer('[1][1][2]'));
			expect(
				scenario.answerOf(`/data/r2-d1[1]/r2-d2[2]/r2-d3[1]/${calculatedField}`)
			).toEqualAnswer(stringAnswer('[1][2][1]'));
			expect(
				scenario.answerOf(`/data/r2-d1[1]/r2-d2[2]/r2-d3[2]/${calculatedField}`)
			).toEqualAnswer(stringAnswer('[1][2][2]'));
			expect(
				scenario.answerOf(`/data/r2-d1[2]/r2-d2[1]/r2-d3[1]/${calculatedField}`)
			).toEqualAnswer(stringAnswer('[2][1][1]'));
			expect(
				scenario.answerOf(`/data/r2-d1[2]/r2-d2[1]/r2-d3[2]/${calculatedField}`)
			).toEqualAnswer(stringAnswer('[2][1][2]'));
			expect(
				scenario.answerOf(`/data/r2-d1[2]/r2-d2[2]/r2-d3[1]/${calculatedField}`)
			).toEqualAnswer(stringAnswer('[2][2][1]'));
			expect(
				scenario.answerOf(`/data/r2-d1[2]/r2-d2[2]/r2-d3[2]/${calculatedField}`)
			).toEqualAnswer(stringAnswer('[2][2][2]'));
		}
	);
});

/**
 * **SPEC NOTES**
 *
 * This suite explicitly tests the fact that the `indexed-repeat` implementation
 * returns a node-set. In review, we discussed the fact that this goes beyond
 * the
 * {@link https://getodk.github.io/xforms-spec/#fn:indexed-repeat | ODK XForms spec language},
 * which currently says that `indexed-repeat`...
 *
 * > Returns a single node value from a node-set by selecting the 1-based index
 * > of a repeat node-set that this node is a child of.
 *
 * In the review discussion, a case was made that the mechanism for producing
 * this "single node value" would be casting the expression's LocationPath
 * equivalent to string. There was some doubt about whether this is expected,
 * based on the behavior of other XPath functions operating on a node-set (such
 * as `count`) or with distinct behavior for node-sets and strings respectively
 * (such as `concat`).
 *
 * These same tests have been run in JavaRosa, confirming that the behavior is
 * consistent between both implementations. As such, we've decided to keep this
 * consistent behavior, and to update the spec language accordingly. These tests
 * further capture the fact that this decision is intentional.
 */
describe('Behavior of node-set results', () => {
	let scenario: Scenario;

	beforeEach(async () => {
		// prettier-ignore
		scenario = await Scenario.init('indexed-repeat', html(
			head(
				title('indexed-repeat'),
				model(
					mainInstance(
						t('data id="indexed-repeat"',
							t('repeat1 jr:template=""',
								t('repeat2 jr:template=""',
									t('value'))),
							t('indexed-repeat-concat'),
							t('indexed-repeat-count'),
							t('meta',
								t('instanceID')))),

					bind('/data/repeat1/repeat2/value').type('string'),
					bind('/data/indexed-repeat-concat')
						.readonly('true()')
						.type('string')
						.calculate('concat(indexed-repeat(  /data/repeat1/repeat2/value  , /data/repeat1 , 1))'),
					bind('/data/indexed-repeat-count')
						.readonly('true()')
						.type('string')
						.calculate('count(indexed-repeat(  /data/repeat1/repeat2/value  , /data/repeat1 , 1))')
				)
			),
			body(
				group('/data/repeat1',
					repeat('/data/repeat1',
						group('/data/repeat1/repeat2',
							repeat('/data/repeat1/repeat2',
								input('/data/repeat1/repeat2/value'))))),
				input('/data/indexed-repeat-concat'),
				input('/data/indexed-repeat-count')
			)));
	});

	it('includes multiple target nodes in a node-set', () => {
		scenario.createNewRepeat('/data/repeat1');
		scenario.createNewRepeat('/data/repeat1[1]/repeat2');
		scenario.answer('/data/repeat1[1]/repeat2[1]/value', 'a');
		scenario.createNewRepeat('/data/repeat1[1]/repeat2');
		scenario.answer('/data/repeat1[1]/repeat2[2]/value', 'b');

		expect(scenario.answerOf('/data/indexed-repeat-concat')).toEqualAnswer(stringAnswer('ab'));
		expect(scenario.answerOf('/data/indexed-repeat-count')).toEqualAnswer(intAnswer(2));
	});

	it('excludes target nodes outside the indexed-repeat subtree', () => {
		scenario.createNewRepeat('/data/repeat1');
		scenario.createNewRepeat('/data/repeat1[1]/repeat2');
		scenario.answer('/data/repeat1[1]/repeat2[1]/value', 'a');
		scenario.createNewRepeat('/data/repeat1[1]/repeat2');
		scenario.answer('/data/repeat1[1]/repeat2[2]/value', 'b');

		// Add second repeat1 and subtree, structurally matching the first. We'll
		// check that nothing added here is considered (since the `indexed-repeat`
		// calls are hardcoded to index 1).
		scenario.createNewRepeat('/data/repeat1');
		scenario.createNewRepeat('/data/repeat1[2]/repeat2');
		scenario.answer('/data/repeat1[2]/repeat2[1]/value', 'a');
		scenario.createNewRepeat('/data/repeat1[2]/repeat2');
		scenario.answer('/data/repeat1[2]/repeat2[2]/value', 'b');

		expect(scenario.answerOf('/data/indexed-repeat-concat')).toEqualAnswer(stringAnswer('ab'));
		expect(scenario.answerOf('/data/indexed-repeat-count')).toEqualAnswer(intAnswer(2));
	});
});
