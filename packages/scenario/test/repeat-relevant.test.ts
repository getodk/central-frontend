import {
	bind,
	body,
	head,
	html,
	input,
	item,
	mainInstance,
	model,
	repeat,
	select1,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario, getRef } from '../src/jr/Scenario.ts';
import type { JRFormDef } from '../src/jr/form/JRFormDef.ts';

describe('Interaction between `<repeat>` and `relevant`', () => {
	/**
	 * **PORTING NOTES**
	 *
	 * While these tests are ported from JavaRosa's tests focusing on its
	 * `FormDef` class, we should consider migrating the tests to use equivalent
	 * APIs directly provided by {@link Scenario} rather than calling into our
	 * partially-equivalent {@link JRFormDef} (which is currently provided with
	 * the intent of completing test porting, but otherwise has no direct
	 * equivalent in our engine/client interfaces). For each test referencing
	 * those `FormDef` APIs:
	 *
	 * - If {@link Scenario} provides a clear analogue to those APIs, sufficient
	 *   to express the same semantics under test, an alternate test will be
	 *   included immediately following the test ported more directly from
	 *   JavaRosa
	 *
	 * - If no such analogue exists on {@link Scenario}, it will be called out
	 *   with additional notes (or a failing test if deemed appropriate).
	 */
	describe('FormDefTest.java', () => {
		describe('repeat relevance', () => {
			/**
			 * **PORTING NOTES**
			 *
			 * Rephrase?
			 */
			it('changes when dependent values of [`relevant`] relevance expression change', async () => {
				const scenario = await Scenario.init(
					'Repeat relevance - dynamic expression',
					html(
						head(
							title('Repeat relevance - dynamic expression'),
							model(
								mainInstance(
									t(
										'data id="repeat_relevance_dynamic"',
										t('selectYesNo', 'no'),
										t('repeat1', t('q1'))
									)
								),
								bind('/data/repeat1').relevant("/data/selectYesNo = 'yes'")
							)
						),
						body(
							select1('/data/selectYesNo', item('yes', 'Yes'), item('no', 'No')),
							repeat('/data/repeat1', input('/data/repeat1/q1'))
						)
					)
				);

				const formDef = scenario.getFormDef();

				expect(formDef.isRepeatRelevant(getRef('/data/repeat1[1]'))).toBe(false);

				scenario.answer('/data/selectYesNo', 'yes');

				expect(formDef.isRepeatRelevant(getRef('/data/repeat1[1]'))).toBe(true);
			});

			it("updates a repeat instance's relevance state when the values of nodes referenced by its `relevant` expression are changed (non-`FormDef` alternate)", async () => {
				const scenario = await Scenario.init(
					'Repeat relevance - dynamic expression',
					html(
						head(
							title('Repeat relevance - dynamic expression'),
							model(
								mainInstance(
									t(
										'data id="repeat_relevance_dynamic"',
										t('selectYesNo', 'no'),
										t('repeat1', t('q1'))
									)
								),
								bind('/data/repeat1').relevant("/data/selectYesNo = 'yes'")
							)
						),
						body(
							select1('/data/selectYesNo', item('yes', 'Yes'), item('no', 'No')),
							repeat('/data/repeat1', input('/data/repeat1/q1'))
						)
					)
				);

				expect(scenario.getAnswerNode('/data/repeat1[1]')).toBeNonRelevant();

				scenario.answer('/data/selectYesNo', 'yes');

				expect(scenario.getAnswerNode('/data/repeat1[1]')).toBeRelevant();
			});
		});
	});
});
