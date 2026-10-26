import {
  bind,
  body,
  head,
  html,
  input,
  label,
  mainInstance,
  model,
  repeat,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.ts';

describe('Interaction between `<repeat>` and `<output>`', () => {
  describe('FormDefTest.java', () => {
    it('output resolves relative references', async () => {
      const scenario = await Scenario.init(
        '<output> with relative ref',
        html(
          head(
            title('output with relative ref'),
            model(
              mainInstance(
                t(
                  'data id="relative-output"',
                  t('repeat jr:template=""', t('position'), t('position_in_label'))
                )
              ),
              bind('/data/repeat/position').type('int').calculate('position(..)'),
              bind('/data/repeat/position_in_label').type('int')
            )
          ),
          body(
            repeat(
              '/data/repeat',
              input(
                '/data/repeat/position_in_label',
                label('Position: <output value=" ../position "/>')
              )
            )
          )
        )
      );

      scenario.next('/data/repeat');
      scenario.createNewRepeat({
        assertCurrentReference: '/data/repeat',
      });
      scenario.next('/data/repeat[1]/position_in_label');

      expect(
        scenario.getQuestionLabelText({
          assertCurrentReference: '/data/repeat[1]/position_in_label',
        })
      ).toBe('Position: 1');

      scenario.next('/data/repeat');
      scenario.createNewRepeat({
        assertCurrentReference: '/data/repeat',
      });
      scenario.next('/data/repeat[2]/position_in_label');

      expect(
        scenario.getQuestionLabelText({
          assertCurrentReference: '/data/repeat[2]/position_in_label',
        })
      ).toBe('Position: 2');
    });

    it('output resolves relative references in `jr:itext`', async () => {
      const scenario = await Scenario.init(
        '<output> with relative ref in translation',
        html(
          head(
            title('output with relative ref in translation'),
            model(
              t(
                'itext',
                t(
                  'translation lang="Français"',
                  t(
                    'text id="/data/repeat/position_in_label:label',
                    t('value', 'Position: <output value="../position"/>')
                  )
                )
              ),
              mainInstance(
                t(
                  'data id="relative-output"',
                  t('repeat jr:template=""', t('position'), t('position_in_label'))
                )
              ),
              bind('/data/repeat/position').type('int').calculate('position(..)'),
              bind('/data/repeat/position_in_label').type('int')
            )
          ),
          body(
            repeat(
              '/data/repeat',
              input(
                '/data/repeat/position_in_label',
                label('Position: <output value=" ../position "/>')
              )
            )
          )
        )
      );

      scenario.next('/data/repeat');
      scenario.createNewRepeat({
        assertCurrentReference: '/data/repeat',
      });
      scenario.next('/data/repeat[1]/position_in_label');

      expect(
        scenario.getQuestionLabelText({
          assertCurrentReference: '/data/repeat[1]/position_in_label',
        })
      ).toBe('Position: 1');

      scenario.next('/data/repeat');
      scenario.createNewRepeat({
        assertCurrentReference: '/data/repeat',
      });
      scenario.next('/data/repeat[2]/position_in_label');

      expect(
        scenario.getQuestionLabelText({
          assertCurrentReference: '/data/repeat[2]/position_in_label',
        })
      ).toBe('Position: 2');
    });
  });
});
