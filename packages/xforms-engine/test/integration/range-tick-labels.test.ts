import {
  bind,
  body,
  head,
  html,
  input,
  item,
  mainInstance,
  model,
  range,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import type { XFormsElement } from '@getodk/common/test-utils/xform-dsl/XFormsElement.ts';
import { assert, describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.ts';

describe('Range tick labels', () => {
  const bounds = { start: 0, end: 10, step: 1 };
  const tickLabelsOf = (scenario: Scenario, reference: string) => {
    const { nodeType, currentState } = scenario.getInstanceNode(reference);

    assert(nodeType === 'range');

    return currentState.tickLabels.map(({ value, label }) => [value, label.asString]);
  };

  const rangeForm = (...modelChildren: XFormsElement[]) => {
    return (rangeElement: XFormsElement, ...bodyChildren: XFormsElement[]) => {
      return html(
        head(
          title('Range tick labels'),
          model(
            mainInstance(t('data id="range-tick-labels"', t('score'), t('filter'))),
            ...modelChildren,
            bind('/data/score').type('int'),
            bind('/data/filter').type('string')
          )
        ),
        body(rangeElement, ...bodyChildren)
      );
    };
  };

  it('has no tick labels without items', async () => {
    const scenario = await Scenario.init('Range', rangeForm()(range('/data/score', bounds)));

    expect(tickLabelsOf(scenario, '/data/score')).toEqual([]);
  });

  it('exposes <item> children in document order', async () => {
    const scenario = await Scenario.init(
      'Range',
      rangeForm()(range('/data/score', bounds, item(10, 'High'), item(0, 'Low'), item(5, 'Mid')))
    );

    expect(tickLabelsOf(scenario, '/data/score')).toEqual([
      [10, 'High'],
      [0, 'Low'],
      [5, 'Mid'],
    ]);
  });

  it('ignores items whose value is not a plain number', async () => {
    const scenario = await Scenario.init(
      'Range',
      rangeForm()(
        range(
          '/data/score',
          bounds,
          item('', 'Empty'),
          item('abc', 'Text'),
          item('1e1', 'Exponent'),
          item(' 5 ', 'Padded'),
          item('5.0', 'Mid')
        )
      )
    );

    expect(tickLabelsOf(scenario, '/data/score')).toEqual([[5, 'Mid']]);
  });

  it('ignores items whose value is outside the range', async () => {
    const scenario = await Scenario.init(
      'Range',
      rangeForm()(
        range('/data/score', bounds, item(-1, 'Below'), item(10, 'High'), item(11, 'Above'))
      )
    );

    expect(tickLabelsOf(scenario, '/data/score')).toEqual([[10, 'High']]);
  });

  it('keeps the first item of a duplicated value', async () => {
    const scenario = await Scenario.init(
      'Range',
      rangeForm()(range('/data/score', bounds, item(5, 'Mid'), item('5.0', 'Five'), item(0, 'Low')))
    );

    expect(tickLabelsOf(scenario, '/data/score')).toEqual([
      [5, 'Mid'],
      [0, 'Low'],
    ]);
  });

  it('translates itemset labels', async () => {
    const scenario = await Scenario.init(
      'Range',
      rangeForm(
        t(
          'itext',
          t(
            'translation lang="English (en)"',
            t('text id="labels-0"', t('value', 'Low')),
            t('text id="labels-1"', t('value', 'High'))
          ),
          t(
            'translation lang="French (fr)"',
            t('text id="labels-0"', t('value', 'Bas')),
            t('text id="labels-1"', t('value', 'Haut'))
          )
        ),
        t(
          'instance id="labels"',
          t(
            'root',
            t('item', t('name', '0'), t('itextId', 'labels-0')),
            t('item', t('name', '10'), t('itextId', 'labels-1'))
          )
        )
      )(
        range(
          '/data/score',
          bounds,
          t(
            `itemset nodeset="instance('labels')/root/item"`,
            t('value ref="name"'),
            t('label ref="jr:itext(itextId)"')
          )
        )
      )
    );

    expect(tickLabelsOf(scenario, '/data/score')).toEqual([
      [0, 'Low'],
      [10, 'High'],
    ]);

    scenario.setLanguage('French (fr)');

    expect(tickLabelsOf(scenario, '/data/score')).toEqual([
      [0, 'Bas'],
      [10, 'Haut'],
    ]);
  });

  it('updates a filtered itemset when the filter changes', async () => {
    const scenario = await Scenario.init(
      'Range',
      rangeForm(
        t(
          'instance id="labels"',
          t(
            'root',
            t('item', t('name', '0'), t('label', 'Bad'), t('group', 'a')),
            t('item', t('name', '10'), t('label', 'Good'), t('group', 'a')),
            t('item', t('name', '0'), t('label', 'Terrible'), t('group', 'b')),
            t('item', t('name', '10'), t('label', 'Great'), t('group', 'b'))
          )
        )
      )(
        range(
          '/data/score',
          bounds,
          t(
            `itemset nodeset="instance('labels')/root/item[group = /data/filter]"`,
            t('value ref="name"'),
            t('label ref="label"')
          )
        ),
        input('/data/filter')
      )
    );

    expect(tickLabelsOf(scenario, '/data/score')).toEqual([]);

    scenario.answer('/data/filter', 'a');

    expect(tickLabelsOf(scenario, '/data/score')).toEqual([
      [0, 'Bad'],
      [10, 'Good'],
    ]);

    scenario.answer('/data/filter', 'b');

    expect(tickLabelsOf(scenario, '/data/score')).toEqual([
      [0, 'Terrible'],
      [10, 'Great'],
    ]);
  });

  it('keeps a value which matches no tick label', async () => {
    const scenario = await Scenario.init(
      'Range',
      rangeForm()(range('/data/score', bounds, item(0, 'Low'), item(10, 'High')))
    );

    scenario.answer('/data/score', 7);

    expect(scenario.answerOf('/data/score').getValue()).toBe('7');
  });
});
