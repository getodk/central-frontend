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
import { assert, describe, expect, it } from 'vitest';
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
		it.fails.each<IndexedRepeatRelativeRefsOptions>(parameters)('$testName', async (options) => {
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
		it.fails('gets an indexed value in a single repeat instance', async () => {
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
		it.fails('gets an indexed value using parallel repeat position', async () => {
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
