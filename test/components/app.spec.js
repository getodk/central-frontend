import sinon from 'sinon';

import FeedbackButton from '../../src/components/feedback-button.vue';

import { logOut } from '../../src/util/session';

import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('App', () => {
  describe('change in Central version', () => {
    beforeEach(mockLogin);

    it('sends the correct request', () => {
      const clock = sinon.useFakeTimers(Date.now());
      return load('/')
        .complete()
        .request(() => {
          clock.tick(15000);
        })
        // This isn't actually what a version looks like. However, the value
        // itself doesn't really matter, but rather only whether it changes.
        .respondWithData(() => '(v2024.1.2-sha)')
        .testRequests([{ url: '/version.txt' }]);
    });

    it('re-sends the request after 60 seconds', () => {
      const clock = sinon.useFakeTimers(Date.now());
      return load('/')
        .complete()
        .request(() => {
          clock.tick(15000);
        })
        .respondWithData(() => '(v2024.1.2-sha)')
        .complete()
        .request(() => {
          clock.tick(60000);
        })
        .respondWithData(() => '(v2024.1.2-sha)')
        .testRequests([{ url: '/version.txt' }]);
    });

    describe('after a version change', () => {
      it('shows an alert', () => {
        const clock = sinon.useFakeTimers(Date.now());
        const reload = sinon.fake();
        return load('/', {
          container: { location: { reload } }
        })
          .complete()
          .request(() => {
            clock.tick(15000);
          })
          .respondWithData(() => '(v2024.1.2-sha)')
          .afterResponse(app => {
            app.should.not.alert();
          })
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
          .afterResponse(async (app) => {
            await clock.tickAsync(0);
            app.should.alert('info', 'The server has been successfully updated.');
            await app.get('.alert-cta').trigger('click');
            reload.called.should.be.true;
          });
      });

      it('stops sending the request', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/')
          .complete()
          .request(() => {
            clock.tick(15000);
          })
          .respondWithData(() => '(v2024.1.2-sha)')
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
        return load('/')
          .complete()
          .request(() => {
            clock.tick(15000);
          })
          .respondWithData(() => '(v2024.1.2-sha)')
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => '(v2024.1.3-sha)')
          .afterResponse(async (app) => {
            clock.tick(0);
            await app.get('.red-alert .close').trigger('click');
            await clock.tickAsync(60000);
            app.should.alert('info', 'The server has been successfully updated.');
          });
      });
    });

    describe('request error', () => {
      it('stops sending the request after a 404', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/')
          .complete()
          .request(() => {
            clock.tick(15000);
          })
          .respond(() => ({ status: 404, data: '' }))
          .complete()
          .testNoRequest(() => {
            clock.tick(60000);
          });
      });

      it('does not stop sending request after a different response error', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/')
          .complete()
          .request(() => {
            clock.tick(15000);
          })
          .respond(() => ({ status: 500, data: '' }))
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => '(v2024.1.2-sha)')
          .testRequests([{ url: '/version.txt' }]);
      });

      it('does not stop sending the request if it is canceled during logout', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/')
          .complete()
          .request(() => {
            clock.tick(15000);
          })
          .beforeEachResponse((app, { url }) => {
            if (url === '/version.txt') logOut(app.vm.$container, false);
          })
          .respondWithData(() => '(v2024.1.2-sha)')
          .respondWithSuccess()
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => '(v2024.1.2-sha)')
          .testRequests([{ url: '/version.txt' }]);
      });

      it('shows an alert despite an intermediate error', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/')
          .complete()
          .request(() => {
            clock.tick(15000);
          })
          .respondWithData(() => '(v2024.1.2-sha)')
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respond(() => ({ status: 500, data: '' }))
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => '(v2024.1.3-sha)')
          .afterResponse(app => {
            clock.tick(0);
            app.should.alert('info', 'The server has been successfully updated.');
          });
      });
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
