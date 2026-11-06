import {
  bind,
  body,
  head,
  html,
  input,
  instance,
  item,
  mainInstance,
  model,
  rankDynamic,
  select1Dynamic,
  selectDynamic,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.ts';

describe('Choice filters', () => {
  const OPTIONS_INSTANCE = instance(
    'options',
    item('one', 'One'),
    item('two', 'Two'),
    item('three', 'Three')
  );

  const CYCLIC_FILTER_FORM = html(
    head(
      title('Select1 self-referencing filter'),
      model(
        mainInstance(t("data id='select1-self-filter'", t('calc'), t('sel'))),
        OPTIONS_INSTANCE,
        bind('/data/calc').type('string').calculate('/data/sel'),
        bind('/data/sel').type('string')
      )
    ),
    body(
      select1Dynamic(
        '/data/sel',
        "instance('options')/root/item[not(selected(current()/../calc, value))]"
      )
    )
  );

  const EXTERNAL_FILTER_FORM = html(
    head(
      title('Filtered select'),
      model(
        mainInstance(t("data id='filtered-select'", t('flt'), t('sel'))),
        OPTIONS_INSTANCE,
        bind('/data/flt').type('string'),
        bind('/data/sel').type('string')
      )
    ),
    body(
      input('/data/flt'),
      select1Dynamic('/data/sel', "instance('options')/root/item[value != /data/flt]")
    )
  );

  describe('referencing the value of their own question', () => {
    it('does not crash a select1 when filter depends on its own value through a calculate', async () => {
      const scenario = await Scenario.init('Select1 self-referencing filter', CYCLIC_FILTER_FORM);

      expect(() => scenario.answer('/data/sel', 'one')).not.toThrow();

      expect(typeof scenario.answerOf('/data/sel').getValue()).toBe('string');
      // A cyclic filter has no single correct choice list, so only
      // check the form keeps working with a non-empty list.
      expect(scenario.choicesOf('/data/sel').size()).toBeGreaterThan(0);
      expect(() => scenario.answer('/data/sel', 'two')).not.toThrow();
    });

    it('does not crash a select when filter references its own value directly', async () => {
      const form = html(
        head(
          title('Select self-referencing filter'),
          model(
            mainInstance(t("data id='select-self-filter'", t('sel'))),
            OPTIONS_INSTANCE,
            bind('/data/sel').type('string')
          )
        ),
        body(
          selectDynamic(
            '/data/sel',
            "instance('options')/root/item[not(selected(/data/sel, value))]"
          )
        )
      );
      const scenario = await Scenario.init('Select self-referencing filter', form);

      expect(() => scenario.answer('/data/sel', 'one', 'two')).not.toThrow();

      expect(typeof scenario.answerOf('/data/sel').getValue()).toBe('string');
      expect(() => scenario.answer('/data/sel', 'three')).not.toThrow();
    });

    it('does not crash a select when filter depends on its own option labels via jr:choice-name', async () => {
      const form = html(
        head(
          title('Choice-name cycle'),
          model(
            mainInstance(t("data id='choice-name-cycle'", t('calc'), t('sel'))),
            instance('options', item('one', 'one'), item('two', 'two'), item('three', 'three')),
            bind('/data/calc').type('string').calculate("jr:choice-name('one', ' /data/sel ')"),
            bind('/data/sel').type('string')
          )
        ),
        body(
          select1Dynamic('/data/sel', "instance('options')/root/item[value != current()/../calc]")
        )
      );

      const scenario = await Scenario.init('Choice-name cycle', form);

      expect(typeof scenario.answerOf('/data/calc').getValue()).toBe('string');
      expect(() => scenario.answer('/data/sel', 'two')).not.toThrow();
    });

    it('restores a self-referencing form in edit mode without crashing', async () => {
      const scenario = await Scenario.init('Select1 self-referencing filter', CYCLIC_FILTER_FORM);

      expect(() => scenario.answer('/data/sel', 'one')).not.toThrow();

      const restored = await scenario.proposed_serializeAndRestoreInstanceState();

      expect(typeof restored.answerOf('/data/sel').getValue()).toBe('string');
      expect(() => restored.answer('/data/sel', 'two')).not.toThrow();
    });

    it('still reacts to other questions after a cycle was stopped', async () => {
      const form = html(
        head(
          title('Cycle then external change'),
          model(
            mainInstance(t("data id='cycle-external'", t('calc'), t('blocker'), t('sel'))),
            OPTIONS_INSTANCE,
            bind('/data/calc').type('string').calculate('/data/sel'),
            bind('/data/blocker').type('string'),
            bind('/data/sel').type('string')
          )
        ),
        body(
          input('/data/blocker'),
          select1Dynamic(
            '/data/sel',
            "instance('options')/root/item[not(selected(current()/../calc, value)) and value != /data/blocker]"
          )
        )
      );
      const scenario = await Scenario.init('Cycle then external change', form);

      expect(() => scenario.answer('/data/sel', 'one')).not.toThrow();

      const choiceValues = () => [...scenario.choicesOf('/data/sel')].map((c) => c.getValue());

      expect(() => scenario.answer('/data/blocker', 'two')).not.toThrow();
      expect(choiceValues()).not.toContain('two');

      expect(() => scenario.answer('/data/blocker', 'three')).not.toThrow();
      expect(choiceValues()).not.toContain('three');
    });

    it('does not crash a rank whose filter depends on its own value through a calculate', async () => {
      const form = html(
        head(
          title('Rank self-referencing filter'),
          model(
            mainInstance(t("data id='rank-self-filter'", t('top'), t('rnk'))),
            OPTIONS_INSTANCE,
            bind('/data/top').type('string').calculate('selected-at(/data/rnk, 0)'),
            bind('/data/rnk').type('string')
          )
        ),
        body(
          rankDynamic('/data/rnk', "instance('options')/root/item[not(selected(/data/top, value))]")
        )
      );
      const scenario = await Scenario.init('Rank self-referencing filter', form);

      expect(() => scenario.answer('/data/rnk', 'one', 'two', 'three')).not.toThrow();

      expect(typeof scenario.answerOf('/data/rnk').getValue()).toBe('string');
      expect(typeof scenario.answerOf('/data/top').getValue()).toBe('string');
    });
  });

  describe('removing a selected option', () => {
    it('clears the answer while the option is filtered out, and restores it when the option returns', async () => {
      const scenario = await Scenario.init('Filtered select', EXTERNAL_FILTER_FORM);

      scenario.answer('/data/sel', 'one');
      expect(scenario.answerOf('/data/sel').getValue()).toBe('one');

      scenario.answer('/data/flt', 'one');
      expect(scenario.answerOf('/data/sel').getValue()).toBe('');
      expect(scenario.choicesOf('/data/sel').size()).toBe(2);

      scenario.answer('/data/flt', 'two');
      expect(scenario.answerOf('/data/sel').getValue()).toBe('one');
    });

    it('does not mistake many synchronous updates for a cycle', async () => {
      const scenario = await Scenario.init('Filtered select', EXTERNAL_FILTER_FORM);

      scenario.answer('/data/sel', 'one');

      for (let i = 0; i < 150; i += 1) {
        scenario.answer('/data/flt', i % 2 === 0 ? 'two' : 'three');
      }

      scenario.answer('/data/flt', 'one');

      expect(scenario.choicesOf('/data/sel').size()).toBe(2);
      expect(scenario.answerOf('/data/sel').getValue()).toBe('');

      scenario.answer('/data/flt', 'two');
      expect(scenario.answerOf('/data/sel').getValue()).toBe('one');
    });

    it('keeps a filter-dependent selection after serialize and restore', async () => {
      const form = html(
        head(
          title('Restore probe'),
          model(
            mainInstance(t("data id='restore-probe'", t('sel'), t('flt'))),
            OPTIONS_INSTANCE,
            bind('/data/sel').type('string'),
            bind('/data/flt').type('string')
          )
        ),
        body(
          // The filter question comes after the select in document order, so the
          // select's options are briefly wrong while the restored form is built.
          select1Dynamic('/data/sel', "instance('options')/root/item[selected(/data/flt, value)]"),
          input('/data/flt')
        )
      );
      const scenario = await Scenario.init('Restore probe', form);

      scenario.answer('/data/flt', 'one');
      scenario.answer('/data/sel', 'one');
      expect(scenario.answerOf('/data/sel').getValue()).toBe('one');

      const restored = await scenario.proposed_serializeAndRestoreInstanceState();

      expect(restored.answerOf('/data/flt').getValue()).toBe('one');
      expect(restored.answerOf('/data/sel').getValue()).toBe('one');
      expect(restored.choicesOf('/data/sel').size()).toBe(1);
    });
  });
});
