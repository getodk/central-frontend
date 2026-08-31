import type { BindBuilderXFormsElement } from '@getodk/common/test-utils/xform-dsl/BindBuilderXFormsElement.ts';
import type { XFormsElement } from '@getodk/common/test-utils/xform-dsl/XFormsElement.ts';
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
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { intAnswer } from '../scenario/answer/ExpectedIntAnswer.ts';
import { Scenario } from '../scenario/jr/Scenario.ts';

// Ported from JavaRosa TriggerableDagTest.java, region Cycles
describe('Computation cycle detection', () => {
  const buildForm = (
    modelFields: readonly XFormsElement[],
    binds: readonly BindBuilderXFormsElement[],
    bodyChildren: readonly XFormsElement[]
  ): XFormsElement => {
    return html(
      head(
        title('Some form'),
        model(mainInstance(t('data id="some-form"', ...modelFields)), ...binds)
      ),
      body(...bodyChildren)
    );
  };

  const fieldNameOf = (bindBuilder: BindBuilderXFormsElement): string => {
    const name = bindBuilder.getNodeset().split('/').at(-1);
    if (name == null) {
      throw new Error(`Unexpected bind nodeset: ${bindBuilder.getNodeset()}`);
    }
    return name;
  };

  const initScenario = (form: XFormsElement): Promise<Scenario> => {
    return Scenario.init('Some form', form);
  };

  // Builds a form with a model field, a bind and a body input per given bind.
  const buildFormForDagCyclesCheck = (...binds: BindBuilderXFormsElement[]): XFormsElement => {
    const modelFields = binds.map((bindBuilder) => t(fieldNameOf(bindBuilder)));
    const inputs = binds.map((bindBuilder) => input(bindBuilder.getNodeset()));

    return buildForm(modelFields, binds, inputs);
  };

  // Cycle detection runs at parse time ({@link rejectComputationCycles}).
  describe('parsing forms with cycles', () => {
    it.each([
      {
        scenario: 'self reference in calculate',
        form: buildFormForDagCyclesCheck(bind('/data/count').type('int').calculate('. + 1')),
      },
      {
        scenario: 'a calculate cycle between fields',
        form: buildFormForDagCyclesCheck(
          bind('/data/a').type('int').calculate('/data/b + 1'),
          bind('/data/b').type('int').calculate('/data/c + 1'),
          bind('/data/c').type('int').calculate('/data/a + 1')
        ),
      },
      {
        scenario: 'self reference in relevance',
        form: buildFormForDagCyclesCheck(bind('/data/count').type('int').relevant('. > 0')),
      },
      {
        scenario: 'self reference in `readonly` condition',
        form: buildFormForDagCyclesCheck(bind('/data/count').type('int').readonly('. > 10')),
      },
      {
        scenario: 'self reference in required condition',
        form: buildFormForDagCyclesCheck(bind('/data/count').type('int').required('. > 10')),
      },
      {
        // No JavaRosa precedent. Before cycle detection, this form loaded and then the
        // engine was stuck in an infinite reactive loop.
        scenario: 'a group relevance referencing a node inside the group',
        form: buildForm(
          [t('details', t('keep'))],
          [
            bind('/data/details').relevant("/data/details/keep != 'no'"),
            bind('/data/details/keep').type('string'),
          ],
          [group('/data/details', input('/data/details/keep'))]
        ),
      },
      {
        scenario: 'a calculate cycle between fields inside and outside of a repeat group',
        form: buildForm(
          [t('group', t('a', '1')), t('b', '1')],
          [
            bind('/data/group/a').type('int').calculate('/data/b + 1'),
            bind('/data/b').type('int').calculate('/data/group[position() = 1]/a + 1'),
          ],
          [group('/data/group', repeat('/data/group', input('/data/group/a'))), input('/data/b')]
        ),
      },
      {
        scenario: 'self reference in a field of a repeat group',
        form: buildForm(
          [t('group', t('a', '1'))],
          [bind('/data/group/a').type('int').calculate('../a + 1')],
          [group('/data/group', repeat('/data/group', input('/data/group/a')))]
        ),
      },
      {
        scenario: 'a calculate cycle between fields of the same repeat instance',
        form: buildForm(
          [t('group', t('a', '1'), t('b', '1'))],
          [
            bind('/data/group/a').type('int').calculate('../b + 1'),
            bind('/data/group/b').type('int').calculate('../a + 1'),
          ],
          [
            group(
              '/data/group',
              repeat('/data/group', input('/data/group/a'), input('/data/group/b'))
            ),
          ]
        ),
      },
    ])('should fail by $scenario, with same error message of JavaRosa', async ({ form }) => {
      await expect(initScenario(form)).rejects.toThrow(
        "Cycle detected in form's relevant and calculation logic!"
      );
    });
  });

  /**
   * **PORTING NOTES**
   *
   * A self-referencing `constraint` is not a cycle: JavaRosa excludes
   * `constraint` from cycle analysis, and so do we. The passing test checks
   * that such a form loads.
   *
   * The two failing tests exercise constraint *value* behavior. Their
   * ported assertions contradict each other (after answering 5, the answer
   * can be neither blank nor 20). They stay marked failing until that
   * behavior is revisited.
   */
  describe('self references in `constraint` (exempt from cycle detection)', () => {
    const selfReferencingConstraintForm = buildFormForDagCyclesCheck(
      bind('/data/count').type('int').constraint('. > 10')
    );

    it('supports self references in constraints (form loads)', async () => {
      await initScenario(selfReferencingConstraintForm);
    });

    it.fails('supports self references in constraints', async () => {
      const scenario = await initScenario(selfReferencingConstraintForm);

      scenario.next('/data/count');
      scenario.answer(5);

      expect(scenario.answerOf('/data/count').getValue()).toBe('');

      scenario.answer(20);

      expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(20));

      scenario.answer(5);

      expect(scenario.answerOf('/data/count')).toEqualAnswer(intAnswer(20));
    });
  });

  /**
   * **PORTING NOTES**
   *
   * Ignored in JavaRosa: these forms have no real cycle (each condition
   * depends on the other field's value, not on its relevance), but
   * JavaRosa's cycle detection rejects them anyway, and its own comments
   * call that a false positive. For parity we reject them too, so the tests
   * are marked failing on purpose. If JavaRosa fixes this, we follow, and
   * these become regression tests for that fix.
   */
  describe('"codependant" expressions', () => {
    it.fails('supports codependant relevant conditions', async () => {
      await initScenario(
        buildFormForDagCyclesCheck(
          bind('/data/a').type('int').relevant('/data/b > 0'),
          bind('/data/b').type('int').relevant('/data/a > 0')
        )
      );
    });

    it.fails('supports codependant required conditions', async () => {
      await initScenario(
        buildFormForDagCyclesCheck(
          bind('/data/a').type('int').required('/data/b > 0'),
          bind('/data/b').type('int').required('/data/a > 0')
        )
      );
    });

    it.fails('supports codependant readonly conditions', async () => {
      await initScenario(
        buildFormForDagCyclesCheck(
          bind('/data/a').type('int').readonly('/data/b > 0'),
          bind('/data/b').type('int').readonly('/data/a > 0')
        )
      );
    });
  });

  /**
   * **PORTING NOTES**
   *
   * Ignored in JavaRosa: each instance reads the previous instance's field —
   * an auto-increment, not a real cycle. Cycle detection drops predicates,
   * so JavaRosa sees a self reference and rejects the form; its own comment
   * calls that incorrect. For parity we reject it too, so the test is marked
   * failing on purpose, like the "codependant" tests above.
   */
  it.fails(
    'supports self-reference dependency when targeting different repeat instance siblings',
    async () => {
      await initScenario(
        buildForm(
          [t('group', t('a', '1'))],
          [
            bind('/data/group/a')
              .type('int')
              .calculate('/data/group[position() = (position(current()) - 1)]/a + 1'),
          ],
          [group('/data/group', repeat('/data/group', input('/data/group/a')))]
        )
      );
    }
  );
});
