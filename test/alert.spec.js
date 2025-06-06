import sinon from 'sinon';
import { ref } from 'vue';

import Home from '../src/components/home.vue';

import { createAlert, useAlert } from '../src/alert';
import { noop } from '../src/util/util';

import { load } from './util/http';
import { mockLogin } from './util/session';
import { withSetup } from './util/lifecycle';

describe('createAlert()', () => {
  for (const type of ['success', 'info', 'warning', 'danger']) {
    describe(`${type}()`, () => {
      it('updates the data', () => {
        const alert = createAlert();
        alert[type]('Something happened!');
        alert.type.should.equal(type);
        alert.message.should.equal('Something happened!');
        alert.state.should.be.true;
      });
    });
  }

  describe('cta()', () => {
    it('updates the data', () => {
      const alert = createAlert();
      should.not.exist(alert.ctaText);
      should.not.exist(alert.ctaHandler);

      alert.info('Something happened!');
      should.not.exist(alert.ctaText);
      should.not.exist(alert.ctaHandler);

      alert.cta('Click here', noop);
      alert.ctaText.should.equal('Click here');
      alert.ctaHandler.should.equal(noop);
    });
  });

  describe('blank()', () => {
    it('updates the data', () => {
      const alert = createAlert();
      alert.info('Something happened!').cta('Click here', noop);
      alert.blank();
      alert.state.should.be.false;
      should.not.exist(alert.message);
      should.not.exist(alert.ctaText);
      should.not.exist(alert.ctaHandler);
    });
  });
});

describe('useAlert()', () => {
  describe('hiding alert after 7 seconds', () => {
    it('hides a success alert after 7 seconds', async () => {
      const clock = sinon.useFakeTimers();
      const alert = withSetup(() => useAlert(ref(null)));
      alert.success('Something good!');
      await clock.tickAsync(6999);
      alert.state.should.be.true;
      await clock.tickAsync(1);
      alert.state.should.be.false;
    });

    it('does not hide a non-success alert', async () => {
      const clock = sinon.useFakeTimers();
      const alert = withSetup(() => useAlert(ref(null)));
      alert.danger('Something bad!');
      await clock.tickAsync(7000);
      alert.state.should.be.true;
    });

    it('restarts the clock for each new alert', async () => {
      const clock = sinon.useFakeTimers();
      const alert = withSetup(() => useAlert(ref(null)));

      alert.success('Something good!');
      await clock.tickAsync(6999);
      alert.state.should.be.true;
      alert.success('Something else good!');
      await clock.tickAsync(1);
      alert.state.should.be.true;
      await clock.tickAsync(6998);
      alert.state.should.be.true;
      await clock.tickAsync(1);
      alert.state.should.be.false;

      alert.success('Something good again!');
      await clock.tickAsync(6999);
      alert.danger('Something bad!');
      await clock.tickAsync(1);
      alert.state.should.be.true;
      await clock.tickAsync(6999);
      alert.state.should.be.true;
    });
  });

  describe('hiding alert after user clicks an a[target="_blank"]', () => {
    beforeEach(mockLogin);

    const preventDefault = (event) => { event.preventDefault(); };
    beforeAll(() => {
      document.addEventListener('click', preventDefault);
    });
    afterAll(() => {
      document.removeEventListener('click', preventDefault);
    });

    it('hides the alert', async () => {
      const app = await load('/', { attachTo: document.body });
      app.vm.$container.alert.info('Something happened!');
      await app.getComponent(Home).get('a[target="_blank"]').trigger('click');
      app.should.not.alert();
    });

    it('does not hide the alert if it was shown after the click', async () => {
      const app = await load('/', { attachTo: document.body });
      const a = app.getComponent(Home).get('a[target="_blank"]');
      a.element.addEventListener('click', () => {
        app.vm.$container.alert.info('Something happened!');
      });
      a.trigger('click');
      app.should.alert();
    });
  });
});
