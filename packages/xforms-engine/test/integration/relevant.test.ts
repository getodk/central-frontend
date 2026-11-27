import {
  bind,
  body,
  group,
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
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../scenario/answer/ExpectedIntAnswer.ts';
import { stringAnswer } from '../scenario/answer/ExpectedStringAnswer.ts';
import type { UntypedAnswer } from '../scenario/answer/UntypedAnswer.ts';
import { Scenario } from '../scenario/jr/Scenario.ts';

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
      expect(scenario.getInstanceNode('/data/group')).toBeNonRelevant();
      expect(scenario.getInstanceNode('/data/group/field')).toBeNonRelevant();

      // Now we make both relevant
      scenario.answer('/data/is-group-relevant', true);
      scenario.answer('/data/is-field-relevant', true);

      expect(scenario.getInstanceNode('/data/group')).toBeRelevant();
      expect(scenario.getInstanceNode('/data/group/field')).toBeRelevant();

      // Now we make the group non-relevant, which makes the field non-relevant
      // regardless of its local relevance expression, which would be satisfied
      // in this case
      scenario.answer('/data/is-group-relevant', false);

      expect(scenario.getInstanceNode('/data/group')).toBeNonRelevant();
      expect(scenario.getInstanceNode('/data/group/field')).toBeNonRelevant();
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
      expect(scenario.getInstanceNode('/data/group')).toBeNonRelevant();
      expect(scenario.getInstanceNode('/data/group/field')).toBeNonRelevant();

      // Now we make both relevant
      scenario.answer('/data/is-group-relevant', true);
      scenario.answer('/data/is-field-relevant', true);

      expect(scenario.getInstanceNode('/data/group')).toBeRelevant();
      expect(scenario.getInstanceNode('/data/group/field')).toBeRelevant();

      // Now we make the group non-relevant, which makes the field non-relevant
      // regardless of its local relevance expression, which would be satisfied
      // in this case
      scenario.answer('/data/is-group-relevant', false);

      expect(scenario.getInstanceNode('/data/group')).toBeNonRelevant();
      expect(scenario.getInstanceNode('/data/group/field')).toBeNonRelevant();
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
      expect(scenario.getInstanceNode('/data/group')).toBeNonRelevant();
      expect(scenario.getInstanceNode('/data/group/field')).toBeNonRelevant();

      // Now we make both relevant
      scenario.answer('/data/is-group-relevant', true);
      scenario.answer('/data/is-field-relevant', true);

      expect(scenario.getInstanceNode('/data/group')).toBeRelevant();
      expect(scenario.getInstanceNode('/data/group/field')).toBeRelevant();

      // Now we make the group non-relevant, which makes the field non-relevant
      // regardless of its local relevance expression, which would be satisfied
      // in this case
      scenario.answer('/data/is-group-relevant', false);

      expect(scenario.getInstanceNode('/data/group')).toBeNonRelevant();
      expect(scenario.getInstanceNode('/data/group/field')).toBeNonRelevant();
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

      expect(scenario.getInstanceNode('/data/group')).toBeNonRelevant();
      expect(scenario.getInstanceNode('/data/outernode')).toBeRelevant();
      expect(scenario.getInstanceNode('/data/group/innernode')).toBeNonRelevant();
    });
  });

  describe('non-relevant nodes', () => {
    it('is excluded from producing default values in an evaluation', async () => {
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
                  t('node', t('value', '5')), // relevant
                  t('node-values')
                )
              ),
              bind('/data/node').relevant('position(current()) > 2'),
              bind('/data/node/value').type('int'),
              bind('/data/node-values').calculate('concat(/data/node/value)')
            )
          ),
          body(group('/data/node', repeat('/data/node', input('/data/node/value'))))
        )
      );

      expect(scenario.answerOf('/data/node-values')).toEqualAnswer(stringAnswer('345'));
    });

    it('excludes default values on nodes which are non-relevant on init', async () => {
      const scenario = await Scenario.init(
        'Some form',
        html(
          head(
            title('exclusion of non-relevant default values'),
            model(
              mainInstance(
                t(
                  'data id="exclusion-of-non-relevant-default-values"',
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
    });
  });

  describe('non-relevant node values', () => {
    /**
     * **PORTING NOTES**
     *
     * - There is currently a recomputation bug, causing the second-to-last
     *   assertion to fail.
     *
     * - The last assertion is incredibly surprising! It appears that JavaRosa
     *   not only **preserves** the node's non-relevant value, but continues to
     *   expose that value to callers... despite treating it as blank when
     *   referenced in XPath expressions, as expected (which is explicitly
     *   exercised in this test)
     */
    it.fails('are always null regardless of their actual value', async () => {
      const scenario = await Scenario.init(
        'Some form',
        html(
          head(
            title('Some form'),
            model(
              mainInstance(
                t(
                  'data id="some-form"',
                  t('relevance-trigger', '1'),
                  t('result'),
                  t('some-field', '42')
                )
              ),
              bind('/data/relevance-trigger').type('boolean'),
              bind('/data/result')
                .type('int')
                .calculate("if(/data/some-field != '', /data/some-field + 33, 33)"),
              bind('/data/some-field').type('int').relevant('/data/relevance-trigger')
            )
          ),
          body(input('/data/relevance-trigger'))
        )
      );

      expect(scenario.answerOf('/data/result')).toEqualAnswer(intAnswer(75));
      expect(scenario.answerOf('/data/some-field')).toEqualAnswer(intAnswer(42));

      scenario.answer('/data/relevance-trigger', false);

      // JR:
      // This shows how JavaRosa will ignore the actual values of non-relevant fields. The
      // W3C XForm specs regard relevance a purely UI concern. No side effects on node values
      // are described in the specs, which implies that a relevance change wouln't
      // have any consequence on a node's value. This means that /data/result should keep having
      // a 75 after making /data/some-field non-relevant.
      expect(scenario.answerOf('/data/result')).toEqualAnswer(intAnswer(33));
      expect(scenario.answerOf('/data/some-field')).toEqualAnswer(intAnswer(42));
    });

    it('are blank when read by a dependent calculate, even without a control', async () => {
      const scenario = await Scenario.init(
        'Relevance on calculate',
        html(
          head(
            title('Relevance on calculate'),
            model(
              mainInstance(t('data id="relevance-calculate"', t('q1'), t('c1'), t('c2'))),
              bind('/data/q1').type('string'),
              bind('/data/c1').calculate("concat('q1: ', /data/q1)").relevant("/data/q1 = 'yes'"),
              bind('/data/c2').calculate('/data/c1')
            )
          ),
          body(input('/data/q1'))
        )
      );

      expect(scenario.answerOf('/data/c2').getValue()).toBe('');

      scenario.answer('/data/q1', 'yes');

      expect(scenario.answerOf('/data/c2')).toEqualAnswer(stringAnswer('q1: yes'));
    });
  });

  interface SkipSurprisingAssertionOptions {
    readonly skipSurprisingNonRelevantValueChecks: boolean;
  }

  /**
   * **PORTING NOTES**
   *
   * - The `nullValue()` assertion is treated as a blank value check, consistent
   *   with other ported tests. To maximize consistency across tests with this
   *   adaptation, that assertion is checked against value returned by
   *   `getValue()`. This feels out of place with the other `toEqualAnswer`
   *   assertions. In general, it might be nice to do a pass making these
   *   similar assertions of differing style more consistent project-wide.
   *
   * - The test fails as ported, but only due to the above noted surprise that
   *   non-relevant values are not blank to callers (despite being blank when
   *   the same node is referenced in an XPath expression). To demonstrate this,
   *   the sub-suite is parameterized to toggle whether that specific assertion
   *   should run. When skipped, all of the other (less surprising) assertions
   *   pass as expected.
   *
   * - Followup: it seems pretty clear from Slack discussion that value
   *   assertions on non-relevant nodes should probably be regarded as testing
   *   implementation details. This test will remain parameterized to allow for
   *   further discussion in review, and further tests following a similar
   *   pattern may skip those assertions.
   *
   * - - -
   *
   * JR:
   *
   * This test was inspired by the issue reported at
   * https://code.google.com/archive/p/opendatakit/issues/888
   * <p>
   * We want to focus on the relationship between relevance and other
   * calculations because relevance can be defined for fields **and groups**,
   * which is a special case of expression evaluation in our DAG.
   */
  describe.each<SkipSurprisingAssertionOptions>([
    { skipSurprisingNonRelevantValueChecks: false },
    { skipSurprisingNonRelevantValueChecks: true },
  ])(
    'verify relation between calculate expressions and relevancy conditions (skip surprising non-relevant value checks: $skipSurprisingNonRelevantValueChecks)',
    ({ skipSurprisingNonRelevantValueChecks }) => {
      let testFn: typeof it | typeof it.fails;

      if (skipSurprisingNonRelevantValueChecks) {
        testFn = it;
      } else {
        testFn = it.fails;
      }

      testFn('[has no clear BDD-ish description equivalent]', async () => {
        const scenario = await Scenario.init(
          'Some form',
          html(
            head(
              title('Some form'),
              model(
                mainInstance(
                  t(
                    'data id="some-form"',
                    t('number1'),
                    t('continue'),
                    t('group', t('number1_x2'), t('number1_x2_x2'), t('number2'))
                  )
                ),
                bind('/data/number1').type('int').constraint('. > 0').required(),
                bind('/data/continue').type('string').required(),
                bind('/data/group').relevant("/data/continue = '1'"),
                bind('/data/group/number1_x2').type('int').calculate('/data/number1 * 2'),
                bind('/data/group/number1_x2_x2')
                  .type('int')
                  .calculate('/data/group/number1_x2 * 2'),
                bind('/data/group/number2')
                  .type('int')
                  .relevant('/data/group/number1_x2 > 0')
                  .required()
              )
            ),
            body(
              input('/data/number1'),
              select1('/data/continue', item(1, 'Yes'), item(0, 'No')),
              group('/data/group', input('/data/group/number2'))
            )
          )
        );

        scenario.next('/data/number1');
        scenario.answer(2);

        if (!skipSurprisingNonRelevantValueChecks) {
          expect(scenario.answerOf('/data/group/number1_x2')).toEqualAnswer(intAnswer(4));
        }

        // JR:
        // The expected value is null because the calculate expression uses a non-relevant field.
        // Values of non-relevant fields are always null.

        // assertThat(scenario.answerOf("/data/group/number1_x2_x2"), is(nullValue()));
        expect(scenario.answerOf('/data/group/number1_x2_x2').getValue()).toBe('');

        scenario.next('/data/continue');
        scenario.answer('1'); // Label: "yes"

        expect(scenario.answerOf('/data/group/number1_x2')).toEqualAnswer(intAnswer(4));
        expect(scenario.answerOf('/data/group/number1_x2_x2')).toEqualAnswer(intAnswer(8));
      });
    }
  );

  /**
   * **PORTING NOTES**
   *
   * Deals with intersection of repeats and relevance. Organizing tests like
   * these is always going to be subjective, but I'll throw it out there now
   * that it might make sense to have more specific suites/modules
   * ("bags"/"vats" lol) rather than trying to lump them into one concern or the
   * other. If for no other reason than intersecting functionality being
   * particularly thorny in terms of essential complexity, which could make for
   * a good organizational principle for these sorts of tests.
   */
  describe('when repeat and top-level node have the same relevance expression, and the expression evaluates to false', () => {
    /**
     * **PORTING NOTES**
     *
     * Rephrase?
     *
     * - - -
     *
     * JR:
     *
     * Identical expressions in a form get collapsed to a single Triggerable and
     * the Triggerable's context becomes its targets' highest common parent (see
     * Triggerable.intersectContextWith). This makes evaluation in the context
     * of repeats hard to reason about. This test shows that relevance is
     * propagated as expected when a relevance expression is shared between a
     * repeat and non-repeat. See https://github.com/getodk/javarosa/issues/603.
     */
    it('omits the repeat range', async () => {
      const scenario = await Scenario.init(
        'Repeat relevance same as other',
        html(
          head(
            title('Repeat relevance same as other'),
            model(
              mainInstance(
                t(
                  'data id="repeat_relevance_same_as_other"',
                  t('selectYesNo', 'no'),
                  t('repeat1', t('q1')),
                  t('q0')
                )
              ),
              bind('/data/q0').relevant("/data/selectYesNo = 'yes'"),
              bind('/data/repeat1').relevant("/data/selectYesNo = 'yes'")
            )
          ),
          body(
            select1('/data/selectYesNo', item('yes', 'Yes'), item('no', 'No')),
            repeat('/data/repeat1', input('/data/repeat1/q1'))
          )
        )
      );

      scenario.jumpToBeginningOfForm();
      scenario.next('/data/selectYesNo');

      const event = scenario.next('END_OF_FORM');

      // assertThat(event, is(FormEntryController.EVENT_END_OF_FORM));
      expect(event.eventType).toBe('END_OF_FORM');
    });
  });
});

describe('FormEntryModelTest.java', () => {
  it('inherits relevance of the outermost group', async () => {
    const scenario = await Scenario.init(
      'Nested relevance',
      html(
        head(
          title('Nested relevance'),
          model(
            mainInstance(
              t(
                'data id="nested_relevance"',
                t('outer', t('inner', t('q1'))),

                t('innerYesNo', 'no'),
                t('outerYesNo', 'no')
              )
            ),
            bind('/data/outer').relevant("/data/outerYesNo = 'yes'"),
            bind('/data/outer/inner').relevant("/data/innerYesNo = 'yes'")
          )
        ),
        body(
          group('/data/outer', group('/data/outer/inner', input('/data/outer/inner/q1'))),
          input('/data/outerYesNo'),
          input('/data/innerYesNo')
        )
      )
    );

    const q1Node = scenario.getInstanceNode('/data/outer/inner/q1');
    expect(q1Node).toBeNonRelevant();
    scenario.answer('/data/innerYesNo', 'yes');
    expect(q1Node).toBeNonRelevant();
    scenario.answer('/data/outerYesNo', 'yes');
    expect(q1Node).toBeRelevant();
  });
});
