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

describe('Range bounds', () => {
  const boundsForm = (
    bindType: 'decimal' | 'int',
    attributes: { start: number; end: number; step: number; appearance?: string }
  ) => {
    return html(
      head(
        title('Range bounds'),
        model(
          mainInstance(t('data id="range-bounds"', t('score'))),
          bind('/data/score').type(bindType)
        )
      ),
      body(rangeControl('/data/score', attributes))
    );
  };

  const boundsErrorMessages = (scenario: Scenario) => {
    return scenario.instanceRoot.validationState.violations.map(({ nodeId, violation }) => {
      return [nodeId, violation.condition, violation.message];
    });
  };

  it('reports no error when end minus start is a multiple of step', async () => {
    const scenario = await Scenario.init(
      'Range bounds',
      boundsForm('decimal', { start: 0, end: 0.3, step: 0.1 })
    );

    expect(boundsErrorMessages(scenario)).toEqual([]);
  });

  it('reports an error when end minus start is not a multiple of step', async () => {
    const scenario = await Scenario.init(
      'Range bounds',
      boundsForm('int', { start: 0, end: 10, step: 3 })
    );
    const { nodeId } = scenario.getInstanceNode('/data/score');

    expect(boundsErrorMessages(scenario)).toEqual([
      [nodeId, 'error', 'Range from 0 to 10 cannot be divided into steps of 3.'],
    ]);
  });

  it('reports an error when a rating end is not a whole number', async () => {
    const scenario = await Scenario.init(
      'Range bounds',
      boundsForm('decimal', { start: 1, end: 4.5, step: 0.5, appearance: 'rating' })
    );
    const { nodeId } = scenario.getInstanceNode('/data/score');

    expect(boundsErrorMessages(scenario)).toEqual([
      [nodeId, 'error', 'Rating "end" must be a whole number, got 4.5.'],
    ]);
  });
});
