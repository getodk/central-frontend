import sinon from 'sinon';

import useVersionMonitor from '../../src/composables/version-monitor';

import createTestContainer from '../util/container';
import { withSetup } from '../util/lifecycle';

describe('useVersionMonitor()', () => {
  it('reloads the page after a vite:preloadError event', () => {
    const reload = sinon.fake();
    const container = createTestContainer({
      location: { reload }
    });
    withSetup(useVersionMonitor, { container });
    window.dispatchEvent(new Event('vite:preloadError'));
    reload.called.should.be.true;
  });
});
