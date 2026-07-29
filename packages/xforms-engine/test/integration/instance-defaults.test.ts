import {
  bind,
  body,
  head,
  html,
  input,
  instance,
  mainInstance,
  model,
  repeat,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.js';
import { intAnswer } from '../scenario/answer/ExpectedIntAnswer.js';
import { stringAnswer } from '../scenario/answer/ExpectedStringAnswer.js';

const IGNORED_INSTANCE_ID = 'ignored for purposes of functionality under test';

describe('Sets field values to given defaults', () => {
  const formDefinition = html(
    head(
      title('Bind defaults'),
      model(
        mainInstance(
          t(
            'root id="bind-defaults" version=""',
            t('name id=""'),
            t('age'),
            t('visit'),
            t('location'),
            t('address', t('city')),
            t('repeat', t('child')),
            t('orx:meta', t('orx:instanceID', IGNORED_INSTANCE_ID))
          )
        ),
        instance('secondary', t('item', t('value', 'A')), t('item', t('value', 'B'))),
        bind('/root/name').type('string'),
        bind('/root/age').type('int'),
        bind('/root/visit').type('dateTime'),
        bind('/root/location').type('geopoint'),
        bind('/root/address/city').type('string'),
        bind('/root/repeat/child').type('string')
      )
    ),
    body(
      input('/root/name'),
      input('/root/age'),
      input('/root/visit'),
      input('/root/location'),
      input('/root/address/city'),
      repeat('/root/repeat', input('/root/repeat/child'))
    )
  );

  describe('binds correctly', () => {
    it('to various types', async () => {
      const instanceDefaults = {
        '/root/name': 'some default',
        '/root/age': '85',
        '/root/visit': '2026-07-29T22:02:05+12:00',
        '/root/location': '38.25146813817506 21.758421137528785 0.0 0.0',
      };
      const scenario = await Scenario.init('Bind defaults', formDefinition, { instanceDefaults });
      expect(scenario.answerOf('/root/name')).toEqualAnswer(stringAnswer('some default'));
      expect(scenario.answerOf('/root/age')).toEqualAnswer(intAnswer(85));
      expect(scenario.answerOf('/root/visit')).toEqualAnswer(
        stringAnswer('2026-07-29T22:02:05+12:00')
      );
      expect(scenario.answerOf('/root/location')).toEqualAnswer(
        stringAnswer('38.25146813817506 21.758421137528785 0.0 0.0')
      );
    });

    it('to groups', async () => {
      const instanceDefaults = { '/root/address/city': 'canberra' };
      const scenario = await Scenario.init('Bind defaults', formDefinition, { instanceDefaults });
      expect(scenario.answerOf('/root/address/city')).toEqualAnswer(stringAnswer('canberra'));
    });

    it('supports short form paths', async () => {
      const instanceDefaults = {
        name: 'some default',
        'address/city': 'canberra',
      };
      const scenario = await Scenario.init('Bind defaults', formDefinition, { instanceDefaults });
      expect(scenario.answerOf('/root/name')).toEqualAnswer(stringAnswer('some default'));
      expect(scenario.answerOf('/root/address/city')).toEqualAnswer(stringAnswer('canberra'));
    });

    it('to repeats', async () => {
      const instanceDefaults = { '/root/repeat[2]/child': 'gregory' };
      const scenario = await Scenario.init('Bind defaults', formDefinition, { instanceDefaults });
      scenario.next('/root/name');
      scenario.next('/root/age');
      scenario.next('/root/visit');
      scenario.next('/root/location');
      scenario.next('/root/address/city');
      scenario.next('/root/repeat[1]');
      scenario.next('/root/repeat[1]/child');
      scenario.next('/root/repeat');
      scenario.createNewRepeat({ assertCurrentReference: '/root/repeat' });
      scenario.next('/root/repeat[2]/child');
      scenario.next('/root/repeat');
      scenario.createNewRepeat({ assertCurrentReference: '/root/repeat' });
      expect(scenario.answerOf('/root/repeat[1]/child')).toEqualAnswer(stringAnswer(''));
      expect(scenario.answerOf('/root/repeat[2]/child')).toEqualAnswer(stringAnswer('gregory'));
      expect(scenario.answerOf('/root/repeat[3]/child')).toEqualAnswer(stringAnswer(''));
    });

    it('ignored instance defaults when editing', async () => {
      const scenario = await Scenario.init('Bind defaults', formDefinition);
      scenario.answer('/root/name', 'original');
      const instanceDefaults = {
        '/root/name': 'edited',
        '/root/age': '85',
        '/root/location': '38.25146813817506 21.758421137528785 0.0 0.0',
      };
      const edited = await scenario.editCurrentInstance({ instanceDefaults });
      expect(edited.answerOf('/root/name')).toEqualAnswer(stringAnswer('original'));
      expect(edited.answerOf('/root/age')).toEqualAnswer(stringAnswer(''));
      expect(edited.answerOf('/root/location')).toEqualAnswer(stringAnswer(''));
    });

    it('instance defaults are restored when resetting', async () => {
      const instanceDefaults = { '/root/name': 'instancedefault' };
      const scenario = await Scenario.init('Bind defaults', formDefinition, { instanceDefaults });
      expect(scenario.answerOf('/root/name')).toEqualAnswer(stringAnswer('instancedefault'));
      scenario.answer('/root/name', 'edited');
      const resetted = scenario.resetCurrentInstance({ instanceDefaults });
      expect(resetted.answerOf('/root/name')).toEqualAnswer(stringAnswer('instancedefault'));
    });

    it('does not bind invalid values', async () => {
      const instanceDefaults = {
        '/root/visit': '2026-99-29T22:02:05+12:00', // there is no 99th month
      };
      const scenario = await Scenario.init('Bind defaults', formDefinition, { instanceDefaults });
      expect(scenario.answerOf('/root/visit')).toEqualAnswer(stringAnswer(''));
    });

    describe('does not bind to protected properties', () => {
      it('does nothing if not value node', async () => {
        const instanceDefaults = { '/root': 'some default' };
        const scenario = await Scenario.init('Bind defaults', formDefinition, {
          instanceDefaults,
        });
        expect(scenario.answerOf('/root/name')).toEqualAnswer(stringAnswer(''));
      });

      it('does not set an attribute', async () => {
        const instanceDefaults = { '/root/name/@id': 'injected' };
        const scenario = await Scenario.init('Bind defaults', formDefinition, {
          instanceDefaults,
        });
        expect(scenario.attributeOf('/root/name', 'id')).toEqualAnswer(stringAnswer(''));
      });

      it('does not set protected meta field', async () => {
        const instanceDefaults = { '/root/orx:meta/orx:instanceID': 'injected' };
        const scenario = await Scenario.init('Bind defaults', formDefinition, {
          instanceDefaults,
        });
        expect(scenario.answerOf('/root/orx:meta/orx:instanceID')).toEqualAnswer(
          stringAnswer(IGNORED_INSTANCE_ID)
        );
      });

      it('does not set fields outside of the primary instance', async () => {
        const secondaryInstance = html(
          head(
            title('Bind defaults'),
            model(
              mainInstance(
                t(
                  'root id="bind-defaults" version=""',
                  t('name'),
                  t('orx:meta', t('orx:instanceID', IGNORED_INSTANCE_ID))
                )
              ),
              instance('secondary', t('item', t('value', 'A')), t('item', t('value', 'B'))),
              bind('/root/name')
                .type('string')
                .calculate("instance('secondary')/root/item[value = 'A']/value")
            )
          ),
          body(input('/root/name'))
        );

        const instanceDefaults = { '/secondary/root/item[1]/value': 'C' };
        const scenario = await Scenario.init('Bind defaults', secondaryInstance, {
          instanceDefaults,
        });
        expect(scenario.answerOf('/root/name')).toEqualAnswer(stringAnswer('A'));
      });
    });
  });
});
