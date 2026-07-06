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
import { beforeEach, describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.js';

const IGNORED_INSTANCE_ID = 'ignored for purposes of functionality under test';

describe('Sets field values to given defaults', () => {
  const formDefinition = html(
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
        bind('/root/name').type('string'),
      )
    ),
    body(input('/root/name'))
  );

  let scenario: Scenario;

  beforeEach(async () => {
    scenario = await Scenario.init('Bind defaults', formDefinition, { defaultValues: { '/root/name': 'some-default' } });
  });

  describe('binds correctly', () => {
    it('strings', async () => {
      expect(scenario.answerOf('/root/name').getValue()).toBe('some-default');
    });
  });
});
