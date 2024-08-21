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
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../../../src/answer/ExpectedIntAnswer.ts';
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
});
