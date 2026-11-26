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
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario, getRef } from '../scenario/jr/Scenario.ts';
import type { JRFormDef } from '../scenario/jr/form/JRFormDef.ts';

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

        expect(scenario.getInstanceNode('/data/repeat1[1]')).toBeNonRelevant();

        scenario.answer('/data/selectYesNo', 'yes');

        expect(scenario.getInstanceNode('/data/repeat1[1]')).toBeRelevant();
      });
    });

    describe('repeat', () => {
      describe('1-based position predicates', () => {
        it('is non-relevant when `relevant` is a static `false()` expression', async () => {
          const scenario = await Scenario.init(
            'Repeat relevance - false()',
            html(
              head(
                title('Repeat relevance - false()'),
                model(
                  mainInstance(t('data id="repeat_relevance_false"', t('repeat1', t('q1')))),
                  bind('/data/repeat1').relevant('false()')
                )
              ),
              body(repeat('/data/repeat1', input('/data/repeat1/q1')))
            )
          );

          const formDef = scenario.getFormDef();

          expect(formDef.isRepeatRelevant(getRef('/data/repeat1[1]'))).toBe(false);
        });

        it('is non-relevant when a repeat node-set is bound with a static `relevant="false()"` expression (non-`FormDef` alternate)', async () => {
          const scenario = await Scenario.init(
            'Repeat relevance - false()',
            html(
              head(
                title('Repeat relevance - false()'),
                model(
                  mainInstance(t('data id="repeat_relevance_false"', t('repeat1', t('q1')))),
                  bind('/data/repeat1').relevant('false()')
                )
              ),
              body(repeat('/data/repeat1', input('/data/repeat1/q1')))
            )
          );

          expect(scenario.getInstanceNode('/data/repeat1[1]')).toBeNonRelevant();
        });
      });

      describe('instance relevance', () => {
        it('changes when dependent values of grandparent [`relevant`] relevance expression change', async () => {
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
                      t('outer', t('inner', t('repeat1', t('q1'))))
                    )
                  ),
                  bind('/data/outer').relevant("/data/selectYesNo = 'yes'")
                )
              ),
              body(
                select1('/data/selectYesNo', item('yes', 'Yes'), item('no', 'No')),
                repeat('/data/outer/inner/repeat1', input('/data/outer/inner/repeat1/q1'))
              )
            )
          );

          const formDef = scenario.getFormDef();

          expect(formDef.isRepeatRelevant(getRef('/data/outer/inner/repeat1[1]'))).toBe(false);

          scenario.answer('/data/selectYesNo', 'yes');

          expect(formDef.isRepeatRelevant(getRef('/data/outer/inner/repeat1[1]'))).toBe(true);
        });

        it("updates a nested repeat instance's `relevant` state when the value of a `relevant` expression dependency outside the outer repeat changes (non-`FormDef` alternate)", async () => {
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
                      t('outer', t('inner', t('repeat1', t('q1'))))
                    )
                  ),
                  bind('/data/outer').relevant("/data/selectYesNo = 'yes'")
                )
              ),
              body(
                select1('/data/selectYesNo', item('yes', 'Yes'), item('no', 'No')),
                repeat('/data/outer/inner/repeat1', input('/data/outer/inner/repeat1/q1'))
              )
            )
          );

          expect(scenario.getInstanceNode('/data/outer/inner/repeat1[1]')).toBeNonRelevant();

          scenario.answer('/data/selectYesNo', 'yes');

          expect(scenario.getInstanceNode('/data/outer/inner/repeat1[1]')).toBeRelevant();
        });
      });

      it('is [non-relevant] irrelevant when grandparent relevance set to false', async () => {
        const scenario = await Scenario.init(
          'Repeat relevance - false()',
          html(
            head(
              title('Repeat relevance - false()'),
              model(
                mainInstance(
                  t(
                    'data id="repeat_relevance_false"',
                    t('outer', t('inner', t('repeat1', t('q1'))))
                  )
                ),
                bind('/data/outer').relevant('false()')
              )
            ),
            body(repeat('/data/outer/inner/repeat1', input('/data/outer/inner/repeat1/q1')))
          )
        );

        const formDef = scenario.getFormDef();

        expect(formDef.isRepeatRelevant(getRef('/data/outer/inner/repeat1[1]'))).toBe(false);
      });

      describe('nested repeat instance', () => {
        it('inherits the static non-relevant state of an ancestor repeat instnace (non-`FormDef` alternate)', async () => {
          const scenario = await Scenario.init(
            'Repeat relevance - false()',
            html(
              head(
                title('Repeat relevance - false()'),
                model(
                  mainInstance(
                    t(
                      'data id="repeat_relevance_false"',
                      t('outer', t('inner', t('repeat1', t('q1'))))
                    )
                  ),
                  bind('/data/outer').relevant('false()')
                )
              ),
              body(repeat('/data/outer/inner/repeat1', input('/data/outer/inner/repeat1/q1')))
            )
          );

          expect(scenario.getInstanceNode('/data/outer/inner/repeat1[1]')).toBeNonRelevant();
        });
      });
    });

    describe('nested repeat relevance', () => {
      it('updates based on parent position', async () => {
        const scenario = await Scenario.init(
          'Nested repeat relevance',
          html(
            head(
              title('Nested repeat relevance'),
              model(
                mainInstance(
                  t(
                    'data id="nested-repeat-relevance"',
                    t('outer', t('inner', t('q1')), t('inner', t('q1'))),
                    t('outer', t('inner', t('q1'))),
                    t('relevance-condition', '0')
                  )
                ),
                bind('/data/relevance-condition').type('string'),
                bind('/data/outer/inner').relevant('position(..) mod 2 = /data/relevance-condition')
              )
            ),
            body(
              repeat('/data/outer', repeat('/data/outer/inner', input('/data/outer/inner/q1'))),
              input('/data/relevance-condition')
            )
          )
        );

        scenario.next('/data/outer[1]');
        scenario.next('/data/outer[2]');
        scenario.next('/data/outer[2]/inner[1]');
        scenario.next('/data/outer[2]/inner[1]/q1');
        scenario.answer('/data/relevance-condition', '1');
        scenario.jumpToBeginningOfForm();
        scenario.next('/data/outer[1]');
        scenario.next('/data/outer[1]/inner[1]');
      });
    });
  });
});
