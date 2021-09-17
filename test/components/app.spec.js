import sinon from 'sinon';

import DocLink from '../../src/components/doc-link.vue';
import ProjectList from '../../src/components/project/list.vue';

import { load } from '../util/http';
import { mockLogin } from '../util/session';

describe('App', () => {
  describe('change in Central version', () => {
    beforeEach(mockLogin);

    it('sends the correct request', () => {
      const clock = sinon.useFakeTimers();
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
      const clock = sinon.useFakeTimers();
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
        const clock = sinon.useFakeTimers();
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
            app.should.alert('info', (message) => {
              message.should.startWith('The server has been updated.');
            });
          });
      });

      it('stops sending the request', () => {
        const clock = sinon.useFakeTimers();
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
        const clock = sinon.useFakeTimers();
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
          .afterResponse(app => {
            app.vm.$alert().blank();
            clock.tick(60000);
            app.should.alert('info', (message) => {
              message.should.startWith('The server has been updated.');
            });
          });
      });
    });

    describe('error response', () => {
      it('stops sending the request after a 404', () => {
        const clock = sinon.useFakeTimers();
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

      it('does not stop sending the request after a different error', () => {
        const clock = sinon.useFakeTimers();
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
    });
  });

  it('hides the alert if the user clicks an a[target="_blank"]', async () => {
    mockLogin();
    const app = await load('/', { attachTo: document.body });
    app.vm.$alert().info('Something happened!');
    const preventDefault = (event) => {
      event.preventDefault();
    };
    document.addEventListener('click', preventDefault);
    await app.getComponent(ProjectList).getComponent(DocLink).trigger('click');
    try {
      app.should.not.alert();
    } finally {
      document.removeEventListener('click', preventDefault);
    }
  });
});
