import sinon from 'sinon';

import Home from '../../src/components/home.vue';

import { load } from '../util/http';
import { mockLogin } from '../util/session';
import FeedbackButton from '../../src/components/feedback-button.vue';

describe('App', () => {
  describe('change in Central version', () => {
    beforeEach(mockLogin);

    const container = {
      config: { centralVersion: '(v2024.1.2-sha)' }
    };

    describe('after a version change', () => {
      it('shows an alert', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/', { container })
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => '(v2024.1.2-sha)')
          .afterResponse(app => {
            app.should.not.alert();
          })
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => '(v2024.1.3-sha)')
          .afterResponse(app => {
            clock.tick(0);
            app.should.alert('info', (message) => {
              message.should.startWith('The server has been updated.');
            });
          });
      });

      it('stops sending the request', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/', { container })
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => '(v2024.1.3-sha)')
          .complete()
          .testNoRequest(() => {
            clock.tick(60000);
          });
      });

      it('keeps alerting the user', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/', { container })
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => '(v2024.1.3-sha)')
          .afterResponse(async (app) => {
            clock.tick(0);
            app.vm.$container.alert.blank();
            await clock.tickAsync(60000);
            app.should.alert('info', (message) => {
              message.should.startWith('The server has been updated.');
            });
          });
      });
    });

    it('does not stop sending request after a response error', () => {
      const clock = sinon.useFakeTimers(Date.now());
      return load('/', { container })
        .complete()
        .request(() => {
          clock.tick(60000);
        })
        .respond(() => ({ status: 500, data: '' }))
        .complete()
        .request(() => {
          clock.tick(60000);
        })
        .respondWithData(() => '(v2024.1.2-sha)')
        .testRequests([{ url: '/version.txt' }]);
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

  describe('feedback button', () => {
    it('is shown if a user is logged in and config is true', async () => {
      const container = {
        config: { showsFeedbackButton: true }
      };
      mockLogin();

      const app = await load('/', { container });
      app.findComponent(FeedbackButton).exists().should.be.true;
    });

    it('is hidden if a user is logged in and config is false', async () => {
      const container = {
        config: { showsFeedbackButton: false }
      };
      mockLogin();

      const app = await load('/', { container });
      app.findComponent(FeedbackButton).exists().should.be.false;
    });

    it('is hidden if no user is logged in and config is true', async () => {
      const container = {
        config: { showsFeedbackButton: true }
      };

      const app = await load('/login', { container }).restoreSession(false);
      app.findComponent(FeedbackButton).exists().should.be.false;
    });
  });
});
