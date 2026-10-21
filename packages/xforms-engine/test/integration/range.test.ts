import {
  bind,
  body,
  head,
  html,
  mainInstance,
  model,
  range as rangeControl,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { beforeEach, describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.ts';

import range from '../scenario/fixtures/test-javarosa/resources/range-form.xml?raw';

describe('Range', () => {
  let scenario: Scenario;

  beforeEach(async () => {
    scenario = await Scenario.init(range);
  });

  it('should allow range to be read', () => {
    expect(scenario.answerOf('/stats/balance').getValue()).toBe('');
  });

  it('should allow range to be set', () => {
    scenario.answer('/stats/balance', '-1');
    expect(scenario.answerOf('/stats/balance').getValue()).toBe('-1.0');
  });

  it('nulls out value if value is out of range', () => {
    scenario.answer('/stats/balance', '-5');
    expect(scenario.answerOf('/stats/balance').getValue()).toBe('');
  });

  it('accepts values when start is larger than end', async () => {
    const reversed = await Scenario.init(
      'Reversed range',
      html(
        head(
          title('Reversed range'),
          model(
            mainInstance(t('data id="reversed-range"', t('count', '4'), t('ratio'))),
            bind('/data/count').type('int'),
            bind('/data/ratio').type('decimal')
          )
        ),
        body(
          rangeControl('/data/count', { start: 10, end: 0, step: 2 }),
          rangeControl('/data/ratio', { start: 1, end: 0, step: 0.1 })
        )
      )
    );

    expect(reversed.answerOf('/data/count').getValue()).toBe('4');

    reversed.answer('/data/count', 8);
    reversed.answer('/data/ratio', 0.3);
    expect(reversed.answerOf('/data/count').getValue()).toBe('8');
    expect(reversed.answerOf('/data/ratio').getValue()).toBe('0.3');

    reversed.answer('/data/count', 12);
    expect(reversed.answerOf('/data/count').getValue()).toBe('');
  });
});
