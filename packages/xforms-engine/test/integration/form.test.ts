import {
  bind,
  body,
  head,
  html,
  mainInstance,
  model,
  t,
  title,
} from '@getodk/common/test-utils/xform-dsl/index.ts';
import { describe, expect, it } from 'vitest';
import { Scenario } from '../scenario/jr/Scenario.ts';

describe('Form-wide functionality', () => {
  describe('form title', () => {
    it('gets a static form title', async () => {
      const staticTitle = 'Static form title';

      const scenario = await Scenario.init(
        staticTitle,
        html(
          head(
            title(staticTitle),
            model(mainInstance(t('data id="static-title-test-form"', t('a'))), bind('/data/a'))
          ),
          body()
        )
      );

      expect(scenario.getTitle()).toBe(staticTitle);
    });

    /**
     * @todo If this functionality were to exist, it would be based on a spec
     * change to support it. While a translated title definition would probably
     * have a pretty predictable format, it doesn't seem predictable _enough_
     * to warrant speculating on what the fixture would look like yet.
     */
    it.todo('gets a translated form title');
  });
});
