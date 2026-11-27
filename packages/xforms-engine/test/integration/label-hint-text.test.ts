import {
  bind,
  body,
  head,
  html,
  input,
  mainInstance,
  model,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.ts';

describe('`<label>` and/or `<hint>` text', () => {
  describe('XFormParserTest.java', () => {
    /**
     * **PORTING NOTES**
     *
     * - JavaRosa produces "placeholders" where outputs are expected in a
     *   label/hint's "inner" text; the output values are substituted after the
     *   fact. The direct port of this test fails, because we include output
     *   results in our label/text serialization. (While it isn't presently
     *   addressed besides type stubs, we anticipate retaining a structural
     *   distinction between outputs and surrounding text when we address
     *   limited Markdown/HTML feature support.)
     *
     *   The `assertOutputNameValues` parameter demonstrates this difference in
     *   behavior, where the option:
     *
     *     - `BLANK`:
     *         - `first_name` and `last_name` fields are blank
     *         - label text assertion expects only `nbsp` preservation
     *         - assertion passes
     *
     *     - `POPULATED`:
     *         - `first_name` and `last_name` fields are non-blank
     *         - assertion expects `first_name` + `nbsp` + `last_name`
     *         - assertion passes
     */
    describe.each([{ assertOutputNameValues: 'BLANK' }, { assertOutputNameValues: 'POPULATED' }])(
      'replace JR output placeholders with expected text: $assertOutputNameValues',
      ({ assertOutputNameValues }) => {
        it('preserves spaces between `<output>` tags', async () => {
          let firstNameValue: string;
          let lastNameValue: string;

          if (assertOutputNameValues === 'POPULATED') {
            firstNameValue = 'Bobby';
            lastNameValue = 'Tables';
          } else {
            firstNameValue = '';
            lastNameValue = '';
          }

          const scenario = await Scenario.init(
            'spaces-outputs',
            html(
              head(
                title('spaces-outputs'),
                model(
                  mainInstance(
                    t(
                      'data id="spaces-outputs"',
                      t('first_name', firstNameValue),
                      t('last_name', lastNameValue),
                      t('question')
                    )
                  ),
                  bind('/data/question').type('string')
                )
              ),
              body(
                input(
                  '/data/question',
                  t(
                    'label',
                    'Full name: <output value=" ../first_name "/>\u00A0<output value=" ../last_name "/>'
                  )
                )
              )
            )
          );

          scenario.next('/data/question');

          const text = scenario.getQuestionLabelText({
            assertCurrentReference: '/data/question',
          });
          const nbsp = '\u00a0';

          expect(text).toEqual(`Full name: ${firstNameValue}${nbsp}${lastNameValue}`);
        });
      }
    );
  });

  it('newline following `<output>` element renders as line break', async () => {
    const scenario = await Scenario.init(
      'label-newline-after-output',
      html(
        head(
          title('label-newline-after-output'),
          model(
            mainInstance(t('data id="label-newline-after-output"', t('field'), t('question'))),
            bind('/data/field').type('string').calculate("'value'"),
            bind('/data/question').type('string')
          )
        ),
        body(input('/data/question', t('label', 'Line 1 <output value="/data/field"/>\nLine 2')))
      )
    );
    scenario.next('/data/question');
    const label = scenario.getQuestionLabel({ assertCurrentReference: '/data/question' }).formatted;
    expect(label).toMatchObject([
      { value: 'Line 1 ' },
      { elementName: 'span', children: [{ value: 'value' }] },
      { elementName: 'br' },
      { value: 'Line 2' },
    ]);
  });

  it('preserves space between `<output>` element and following text', async () => {
    const scenario = await Scenario.init(
      'label-space-after-output',
      html(
        head(
          title('label-space-after-output'),
          model(
            mainInstance(t('data id="label-space-after-output"', t('field'), t('question'))),
            bind('/data/field').type('string').calculate("'value'"),
            bind('/data/question').type('string')
          )
        ),
        body(input('/data/question', t('label', 'Parcel <output value="/data/field"/> not found')))
      )
    );
    scenario.next('/data/question');
    const label = scenario.getQuestionLabel({ assertCurrentReference: '/data/question' }).formatted;
    expect(label).toMatchObject([
      { value: 'Parcel ' },
      { elementName: 'span', children: [{ value: 'value' }] },
      { value: ' not found' },
    ]);
  });
});
