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
import { intAnswer } from '../src/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../src/answer/ExpectedStringAnswer.ts';
import type { UntypedAnswer } from '../src/answer/UntypedAnswer.ts';
import { Scenario, getRef } from '../src/jr/Scenario.ts';
import { XPathPathExpr } from '../src/jr/xpath/XPathPathExpr.ts';
import { XPathPathExprEval } from '../src/jr/xpath/XPathPathExprEval.ts';

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

	describe('relevance', () => {
		/**
		 * JR:
		 *
		 * Nodes can be nested differently in the model and body. The model structure is used
		 * to determine relevance inheritance.
		 */
		it('is determined by model nesting', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(t('data id="some-form"', t('outernode'), t('group', t('innernode')))),
							bind('/data/group').relevant('false()')
						)
					),
					body(group('/data/group', input('/data/outernode'), input('/data/group/innernode')))
				)
			);

			expect(scenario.getAnswerNode('/data/group')).toBeNonRelevant();
			expect(scenario.getAnswerNode('/data/outernode')).toBeRelevant();
			expect(scenario.getAnswerNode('/data/group/innernode')).toBeNonRelevant();
		});
	});

	describe('non-relevant nodes', () => {
		/**
		 * **PORTING NOTES**
		 *
		 * 1. This is almost certainly testing implementation details. We do not
		 *    expose anything like this in the engine/client interface, nor do we
		 *    anticipate doing so. Insofar as there is behavior we'd want to test
		 *    for correctness (and there is!), it's probably better expressed by
		 *    observing the effect non-relevance has on the values produced. A brief
		 *    attempt at an alternate expression of this test follows.
		 *
		 * 2. This exact form structure is not presently supported by the engine! It
		 *    fails because there is a check for same-name/same-parent nodes which
		 *    don't correspond to a repeat (range). It's worth discussing whether
		 *    this is a form structure we expect to support, and what sorts of form
		 *    design would produce a form with a similar shape.
		 *
		 * 3. Regardless of whether we intend to support forms of a similar shape,
		 *    it's also important to observe the semantics of the `relevant`
		 *    expression itself. The `position()` call is **rather likely** to be
		 *    evaluated against the context of the `<bind nodeset>` expression.
		 *    (It's also possible to interpret it as evaluated against the parent's
		 *    children, i.e. `/data/*`, but this seems much less likely to be the
		 *    case.) This wouldn't be surprising, it may even be exactly what's
		 *    expected. But the current engine behavior evaluates bind expressions
		 *    against the bound node itself, as the initial "context node" (in XPath
		 *    semantic terms)... as such, a `position()` call will currently always
		 *    return `1` (unless called against some other context established by
		 *    preceding expression steps).
		 */
		it.fails('[is] are excluded from nodeset evaluation', async () => {
			const scenario = await Scenario.init(
				'Some form',
				html(
					head(
						title('Some form'),
						model(
							mainInstance(
								t(
									'data id="some-form"',
									// position() is one-based
									t('node', t('value', '1')), // non-relevant
									t('node', t('value', '2')), // non-relevant
									t('node', t('value', '3')), // relevant
									t('node', t('value', '4')), // relevant
									t('node', t('value', '5')) // relevant
								)
							),
							bind('/data/node').relevant('position() > 2'),
							bind('/data/node/value').type('int')
						)
					),
					body(group('/data/node', input('/data/node/value')))
				)
			);

			// The XPathPathExprEval is used when evaluating the nodesets that the
			// xpath functions declared in triggerable expressions need to operate
			// upon. This assertion shows that non-relevant nodes are not included
			// in the resulting nodesets
			expect(
				new XPathPathExprEval()
					.eval(getRef('/data/node'), scenario.getEvaluationContext())
					.getReferences()
					.size()
			).toBe(3);

			// The method XPathPathExpr.getRefValue is what ultimately is used by
			// triggerable expressions to extract the values they need to operate
			// upon. The following assertion shows how extrating values from
			// non-relevant nodes returns `null` values instead of the actual values
			// they're holding
			expect(
				XPathPathExpr.getRefValue(
					scenario.getFormDef().getMainInstance(),
					scenario.getEvaluationContext(),
					scenario.expandSingle(getRef('/data/node[2]/value'))
				)
			).toBe('');

			// ... as opposed to the value that we can get by resolving the same
			// reference with the main instance, which has the expected `2` value
			expect(scenario.answerOf('/data/node[2]/value')).toEqualAnswer(intAnswer(2));
		});

		/**
		 * **PORTING NOTES** (supplemental to test above)
		 *
		 * This test exercises different semantics than the test above ported from
		 * JavaRosa, but would also serve to exercise the concept that non-relevance
		 * excludes a node from evaluation: specifically by virtue of its value
		 * being blank.
		 *
		 * Unfortunately, it also reveals a bug in the engine's relevance
		 * computation logic! At a glance, it appears that:
		 *
		 * 1. The `calculate` is evaluated against the nodes' default values
		 * 2. Before relevance is computed for those nodes
		 * 3. Finally, failing to recompute the `calculate` once those nodes'
		 *    non-relevance is established
		 */
		it.fails(
			'is excluded from producing values in an evaluation (supplemental to previous test)',
			async () => {
				const scenario = await Scenario.init(
					'Some form',
					html(
						head(
							title('exclusion of non-relevant values'),
							model(
								mainInstance(
									t(
										'data id="exclusion-of-non-relevant-values"',
										t('is-node-a-relevant', 'no'),
										t('is-node-b-relevant', 'no'),
										t('is-node-c-relevant', 'yes'),
										t('is-node-d-relevant', 'yes'),
										t('is-node-e-relevant', 'yes'),
										// position() is one-based
										t('node-a', t('value', '1')), // non-relevant
										t('node-b', t('value', '2')), // non-relevant
										t('node-c', t('value', '3')), // relevant
										t('node-d', t('value', '4')), // relevant
										t('node-e', t('value', '5')), // relevant,
										t('node-x-concat') // calculates a concatenation of node-a through node-e
									)
								),
								bind('/data/node-a').relevant("/data/is-node-a-relevant = 'yes'"),
								bind('/data/node-b').relevant("/data/is-node-b-relevant = 'yes'"),
								bind('/data/node-c').relevant("/data/is-node-c-relevant = 'yes'"),
								bind('/data/node-d').relevant("/data/is-node-d-relevant = 'yes'"),
								bind('/data/node-e').relevant("/data/is-node-e-relevant = 'yes'"),
								bind('/data/node-x-concat').calculate(
									'concat(/data/node-a, /data/node-b, /data/node-c, /data/node-d, /data/node-e)'
								),
								bind('/data/node/value').type('int')
							)
						),

						body(
							group('/data/node-a', input('/data/node-a/value')),
							group('/data/node-b', input('/data/node-b/value')),
							group('/data/node-c', input('/data/node-c/value')),
							group('/data/node-d', input('/data/node-d/value')),
							group('/data/node-e', input('/data/node-e/value')),
							input('/data/node-x-concat')
						)
					)
				);

				expect(scenario.answerOf('/data/node-x-concat')).toEqualAnswer(stringAnswer('345'));
			}
		);
	});
});
