import sinon from 'sinon';
import EnketoIframe from '../../src/components/enketo-iframe.vue';
import { mergeMountOptions, mount } from '../util/lifecycle';
import { mockRouter } from '../util/router';
import { wait } from '../util/util';
import testData from '../data';
import { load } from '../util/http';
import { mockLogin } from '../util/session';

const enketoId = 'sCTIfjC5LrUto4yVXRYJkNKzP7e53vo';

const mountComponent = (options) =>
  mount(EnketoIframe, mergeMountOptions(options, {
    container: {
      router: mockRouter()
    },
    props: {
      enketoId
    },
    attachTo: document.body
  }));

const postMessageToParent = async (iframe, data) => {
  const script = document.createElement('script');
  script.textContent = `window.parent.postMessage('${data}', "*");`;
  iframe.element.contentDocument.body.appendChild(script);
  await wait();
};

const submit = async (component) => {
  const form = component.get('#account-login form');
  await form.get('input[type="email"]').setValue('test@email.com');
  await form.get('input[type="password"]').setValue('foo');
  return form.trigger('submit');
};

describe('EnketoIframe', () => {
  [
    { actionType: 'new', expected: `/enketo-passthrough/${enketoId}` },
    { actionType: 'public-link', expected: `/enketo-passthrough/single/${enketoId}` },
    { actionType: 'preview', expected: `/enketo-passthrough/preview/${enketoId}` },
  ].forEach(({ actionType, expected }) => {
    it(`renders iframe with correct src when actionType is ${actionType}`, () => {
      const wrapper = mountComponent({
        props: { enketoId, actionType }
      });
      const iframe = wrapper.find('iframe');
      iframe.exists().should.be.true;
      iframe.attributes('src').should.contain(expected);
    });
  });

  it('renders iframe with /single prefix when single=true query parameter for new submission', async () => {
    mockLogin();
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });
    const app = await load('/projects/1/forms/a/submissions/new?single=true')
      .complete();

    const iframe = app.find('iframe');
    iframe.attributes('src').should.contain('/enketo-passthrough/single/');
  });

  it('renders iframe without /single prefix when single=false for public-link', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a' });

    const app = await load(`/f/${enketoId}?single=false&st=token`)
      .restoreSession(false) // it's public link so not need to restore sessioin
      .complete();

    const iframe = app.find('iframe');
    iframe.attributes('src').should.contain(`/enketo-passthrough/${enketoId}`);
    iframe.attributes('src').should.not.contain('/single/');
  });

  it('redirects on submissionsuccess message with return_url - internal', async () => {
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'public-link' },
      container: {
        router: mockRouter(`/?return_url=${window.location.origin}/projects/1`)
      }
    });
    const iframe = wrapper.find('iframe');

    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);

    wrapper.vm.$router.push.calledWith('/projects/1').should.be.true;
  });

  it('redirects on submissionsuccess message with return_url - external', async () => {
    const fakeAssign = sinon.fake();
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'public-link' },
      container: {
        router: mockRouter('/?return_url=http://example.com/projects/1'),
        location: {
          origin: window.location.origin,
          assign: (url) => {
            fakeAssign(url);
          }
        }
      }
    });
    const iframe = wrapper.find('iframe');

    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);

    fakeAssign.calledWith(new URL('http://example.com/projects/1')).should.be.true;
  });

  it('redirect on submissionsuccess for new submission when single=true', async () => {
    const fakeAssign = sinon.fake();
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'new' },
      container: {
        router: mockRouter('/?return_url=http://example.com/projects/1&single=true'),
        location: {
          origin: window.location.origin,
          assign: (url) => {
            fakeAssign(url);
          }
        }
      }
    });
    const iframe = wrapper.find('iframe');

    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);

    fakeAssign.called.should.be.true;
    fakeAssign.args[0][0].href.should.equal('http://example.com/projects/1');
  });

  it('does not redirect on invalid return URL', async () => {
    const fakeAssign = sinon.fake();
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'public-link' },
      container: {
        router: mockRouter('/?return_url=example.com'), //protocol is missing
        location: {
          origin: window.location.origin,
          assign: (url) => {
            fakeAssign(url);
          }
        }
      }
    });
    const iframe = wrapper.find('iframe');

    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);

    fakeAssign.called.should.be.false;
    wrapper.vm.$router.push.called.should.be.false;
  });

  it('does not redirect on submissionsuccess for public-link when single=false', async () => {
    const fakeAssign = sinon.fake();
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'public-link' },
      container: {
        router: mockRouter('/?return_url=http://example.com/projects/1&single=false'),
        location: {
          origin: window.location.origin,
          assign: (url) => {
            fakeAssign(url);
          }
        }
      }
    });
    const iframe = wrapper.find('iframe');

    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);

    fakeAssign.called.should.be.false;
  });

  // 'single' query parameter is false implicitly
  it('does not redirects on submissionsuccess for new submission', async () => {
    const fakeAssign = sinon.fake();
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'new' },
      container: {
        router: mockRouter('/?return_url=http://example.com/projects/1'),
        location: {
          origin: window.location.origin,
          assign: (url) => {
            fakeAssign(url);
          }
        }
      }
    });
    const iframe = wrapper.find('iframe');

    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);

    fakeAssign.called.should.be.false;
  });

  it('bubbles up the message event', async () => {
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'new', instanceId: 'test-instance' },
      container: {
        router: mockRouter(`/?parentWindowOrigin=${window.location.origin}`)
      }
    });

    const postMessage = sinon.fake();
    sinon.replace(window.parent, 'postMessage', postMessage);

    const iframe = wrapper.find('iframe');

    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });

    await postMessageToParent(iframe, data);

    postMessage.calledWith(data, window.location.origin).should.be.true;
  });

  it('should not bubble up the message event if origin is different', async () => {
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'new', instanceId: 'test-instance' },
      container: {
        router: mockRouter(`/?parentWindowOrigin=${window.location.origin}`),
        location: {
          origin: 'https://example.com'
        }
      }
    });

    const postMessage = sinon.fake();
    sinon.replace(window.parent, 'postMessage', postMessage);

    const iframe = wrapper.find('iframe');

    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);

    postMessage.called.should.be.false;
  });

  it('encodes spaces as %20 instead of + in query parameters', () => {
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'new' },
      container: {
        router: mockRouter('/?d[/some/path]=hello world')
      }
    });
    const iframe = wrapper.find('iframe');
    const src = iframe.attributes('src');

    src.should.contain('hello%20world');
  });

  it('passes + sign as %20', () => {
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'new' },
      container: {
        router: mockRouter('/?d[/some/path]=hello + world')
      }
    });
    const iframe = wrapper.find('iframe');
    const src = iframe.attributes('src');

    src.should.contain('hello%20%20%20world');
  });

  it('should pass %20 to the iframe after login redirect', () => {
    testData.extendedForms.createPast(1);
    testData.extendedUsers.createPast(1, { email: 'test@email.com', role: 'none' });
    return load('/login?next=%2Fprojects%2F1%2Fforms%2Ff%2Fsubmissions%2Fnew%3Fd%5Bfirstname%5D%3Djohn%2520doe')
      .restoreSession(false)
      .complete()
      .request(submit)
      .respondWithData(() => testData.sessions.createNew())
      .respondWithData(() => testData.extendedUsers.last())
      .respondWithData(() => testData.extendedProjects.first())
      .respondWithData(() => testData.extendedForms.last())
      .afterResponses(app => {
        const iframe = app.find('iframe');
        const src = iframe.attributes('src');
        src.should.contain('john%20doe');
      });
  });
});


