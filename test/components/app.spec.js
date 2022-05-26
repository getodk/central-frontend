import sinon from 'sinon';

import Home from '../../src/components/home.vue';

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
        .respondWithData(() => 'v1.2')
        .testRequests([{ url: '/version.txt' }]);
    });

    it('re-sends the request after 60 seconds', () => {
      const clock = sinon.useFakeTimers(Date.now());
      return load('/')
        .complete()
        .request(() => {
          clock.tick(15000);
        })
        .respondWithData(() => 'v1.2')
        .complete()
        .request(() => {
          clock.tick(60000);
        })
        .respondWithData(() => 'v1.2')
        .testRequests([{ url: '/version.txt' }]);
    });

    describe('after a version change', () => {
      it('shows an alert', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/')
          .complete()
          .request(() => {
            clock.tick(15000);
          })
          .respondWithData(() => 'v1.2')
          .afterResponse(app => {
            app.should.not.alert();
          })
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => 'v1.2')
          .afterResponse(app => {
            app.should.not.alert();
          })
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => 'v1.3')
          .afterResponse(app => {
            clock.tick(0);
            app.should.alert('info', (message) => {
              message.should.startWith('The server has been updated.');
            });
          });
      });

      it('stops sending the request', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/')
          .complete()
          .request(() => {
            clock.tick(15000);
          })
          .respondWithData(() => 'v1.2')
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => 'v1.3')
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
          .respondWithData(() => 'v1.2')
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => 'v1.3')
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
          .respondWithData(() => 'v1.2')
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
          .respondWithData(() => 'v1.2')
          .respondWithSuccess()
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => 'v1.2')
          .testRequests([{ url: '/version.txt' }]);
      });

      it('shows an alert despite an intermediate error', () => {
        const clock = sinon.useFakeTimers(Date.now());
        return load('/')
          .complete()
          .request(() => {
            clock.tick(15000);
          })
          .respondWithData(() => 'v1.2')
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respond(() => ({ status: 500, data: '' }))
          .complete()
          .request(() => {
            clock.tick(60000);
          })
          .respondWithData(() => 'v1.3')
          .afterResponse(app => {
            clock.tick(0);
            app.should.alert('info', (message) => {
              message.should.startWith('The server has been updated.');
            });
          });
      });
    });
  });

  describe('hiding alert after user clicks an a[target="_blank"]', () => {
    beforeEach(mockLogin);

    const preventDefault = (event) => { event.preventDefault(); };
    before(() => {
      document.addEventListener('click', preventDefault);
    });
    after(() => {
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
