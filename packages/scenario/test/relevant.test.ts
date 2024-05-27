import {
	bind,
	body,
	group,
	head,
	html,
	input,
	mainInstance,
	model,
	t,
	title,
} from '@getodk/common/test/fixtures/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import type { UntypedAnswer } from '../src/answer/UntypedAnswer.ts';
import { Scenario } from '../src/jr/Scenario.ts';

describe('Relevance - TriggerableDagTest.java', () => {
	/**
	 * Non-relevance is inherited from ancestor nodes, as per the W3C XForms specs:
	 * - https://www.w3.org/TR/xforms11/#model-prop-relevant
	 * - https://www.w3.org/community/xformsusers/wiki/XForms_2.0#The_relevant_Property
	 */

	describe('non-relevance', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * - This fails because the `relevant` expressions produce node-sets, which
		 *   will always evaluate to `true` when those nodes are present (which they
		 *   always are in this test).
		 *
		 * - Those node-sets evaluate to nodes which are bound with `<bind
		 *   type="boolean" />`, which strongly suggests that a bind's data type
		 *   should influence casting semantics in expressions like `relevant`, and
		 *   perhaps more generally.
		 *
		 * - There are some unaddressed casting considerations which **might be**
		 *   implied by this, discussed in greater detail in porting notes on
		 *   {@link UntypedAnswer}.
		 *
		 * Two additional variants of this test are added immediately following this
		 * one, both briefly exploring some of the contours of the current failure.
		 */
		it.fails('is inherited from ancestors', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(
								t(
									'data id="some-form"',
									t('is-group-relevant'),
									t('is-field-relevant'),
									t('group', t('field'))
								)
							),
							bind('/data/is-group-relevant').type('boolean'),
							bind('/data/is-field-relevant').type('boolean'),
							bind('/data/group').relevant('/data/is-group-relevant'),
							bind('/data/group/field').type('string').relevant('/data/is-field-relevant')
						)
					),
					body(
						input('/data/is-group-relevant'),
						input('/data/is-field-relevant'),
						group('/data/group', input('/data/group/field'))
					)
				)
			);

			// Form initialization evaluates all triggerables, which makes the group and
			//field non-relevants because their relevance expressions are not satisfied
			expect(scenario.getAnswerNode('/data/group')).toBeNonRelevant();
			expect(scenario.getAnswerNode('/data/group/field')).toBeNonRelevant();

			// Now we make both relevant
			scenario.answer('/data/is-group-relevant', true);
			scenario.answer('/data/is-field-relevant', true);

			expect(scenario.getAnswerNode('/data/group')).toBeRelevant();
			expect(scenario.getAnswerNode('/data/group/field')).toBeRelevant();

			// Now we make the group non-relevant, which makes the field non-relevant
			// regardless of its local relevance expression, which would be satisfied
			// in this case
			scenario.answer('/data/is-group-relevant', false);

			expect(scenario.getAnswerNode('/data/group')).toBeNonRelevant();
			expect(scenario.getAnswerNode('/data/group/field')).toBeNonRelevant();
		});

		/**
		 * **PORTING NOTES** (first variant of ported test above)
		 *
		 * This test is identical to the test above, except that both `relevant`
		 * expressions are wrapped in a `string()` XPath call. The test still fails,
		 * but notably the failing assertion comes later:
		 *
		 * In the original test, the first assertion fails because a `node-set`
		 * expression which resolves to any node will always cast to `true`. When
		 * the value is cast to a string, the node's text value is consulted in
		 * casting, producing `false` when empty.
		 *
		 * Ultimately, the test fails when checking restoration of the `false`
		 * state. This is because the `false` value is presently being persisted to
		 * the primary instance as the string `"0"` (which, as I recall, is the
		 * expected serialization of boolean `false`). Since the `relevant`
		 * expression itself produces a string value, and with the engine still
		 * following strict XPath casting semantics, the value `"0"` is also cast to
		 * boolean `true` (again, consistent with XPath semantics).
		 */
		it.fails('is inherited from ancestors (variant #1: node-set semantics -> string)', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(
								t(
									'data id="some-form"',
									t('is-group-relevant'),
									t('is-field-relevant'),
									t('group', t('field'))
								)
							),
							bind('/data/is-group-relevant').type('boolean'),
							bind('/data/is-field-relevant').type('boolean'),
							bind('/data/group').relevant('string(/data/is-group-relevant)'),
							bind('/data/group/field').type('string').relevant('string(/data/is-field-relevant)')
						)
					),
					body(
						input('/data/is-group-relevant'),
						input('/data/is-field-relevant'),
						group('/data/group', input('/data/group/field'))
					)
				)
			);

			// Form initialization evaluates all triggerables, which makes the group and
			//field non-relevants because their relevance expressions are not satisfied
			expect(scenario.getAnswerNode('/data/group')).toBeNonRelevant();
			expect(scenario.getAnswerNode('/data/group/field')).toBeNonRelevant();

			// Now we make both relevant
			scenario.answer('/data/is-group-relevant', true);
			scenario.answer('/data/is-field-relevant', true);

			expect(scenario.getAnswerNode('/data/group')).toBeRelevant();
			expect(scenario.getAnswerNode('/data/group/field')).toBeRelevant();

			// Now we make the group non-relevant, which makes the field non-relevant
			// regardless of its local relevance expression, which would be satisfied
			// in this case
			scenario.answer('/data/is-group-relevant', false);

			expect(scenario.getAnswerNode('/data/group')).toBeNonRelevant();
			expect(scenario.getAnswerNode('/data/group/field')).toBeNonRelevant();
		});

		/**
		 * **PORTING NOTES** (second variant)
		 *
		 * This variant of the ported JavaRosa test again casts the `relevant`
		 * expressions, this time to `number`. Here we see the test passes! This
		 * variant is included because it demonstrates all of the findings above, by
		 * showing how strict XPath casting semantics interact with the test form's
		 * expected XForms semantics.
		 */
		it('is inherited from ancestors (variant #2: node-set semantics -> number)', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(
								t(
									'data id="some-form"',
									t('is-group-relevant'),
									t('is-field-relevant'),
									t('group', t('field'))
								)
							),
							bind('/data/is-group-relevant').type('boolean'),
							bind('/data/is-field-relevant').type('boolean'),
							bind('/data/group').relevant('number(/data/is-group-relevant)'),
							bind('/data/group/field').type('string').relevant('number(/data/is-field-relevant)')
						)
					),
					body(
						input('/data/is-group-relevant'),
						input('/data/is-field-relevant'),
						group('/data/group', input('/data/group/field'))
					)
				)
			);

			// Form initialization evaluates all triggerables, which makes the group and
			//field non-relevants because their relevance expressions are not satisfied
			expect(scenario.getAnswerNode('/data/group')).toBeNonRelevant();
			expect(scenario.getAnswerNode('/data/group/field')).toBeNonRelevant();

			// Now we make both relevant
			scenario.answer('/data/is-group-relevant', true);
			scenario.answer('/data/is-field-relevant', true);

			expect(scenario.getAnswerNode('/data/group')).toBeRelevant();
			expect(scenario.getAnswerNode('/data/group/field')).toBeRelevant();

			// Now we make the group non-relevant, which makes the field non-relevant
			// regardless of its local relevance expression, which would be satisfied
			// in this case
			scenario.answer('/data/is-group-relevant', false);

			expect(scenario.getAnswerNode('/data/group')).toBeNonRelevant();
			expect(scenario.getAnswerNode('/data/group/field')).toBeNonRelevant();
		});
	});
});
