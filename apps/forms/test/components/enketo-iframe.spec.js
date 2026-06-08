import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import EnketoIframe from '../../src/components/enketo-iframe.vue';

const enketoId = 'sCTIfjC5LrUto4yVXRYJkNKzP7e53vo';


// const wait = async () => new Promise(resolve => { setTimeout(resolve, 100) });

// const postMessageToParent = async (iframe, data) => {
//   // await new Promise((resolve) => {
//   //   iframe.element.addEventListener('load', resolve, { once: true })
//   // })

//   await wait();
//   const script = document.createElement('script');
//   script.textContent = `window.parent.postMessage('${data}', "*");`;
//   iframe.element.contentDocument.body.appendChild(script);
//   // return wait();
// };

// const submit = async (component) => {
//   const form = component.get('#account-login form');
//   await form.get('input[type="email"]').setValue('test@email.com');
//   await form.get('input[type="password"]').setValue('foo');
//   return form.trigger('submit');
// };

let query = {};
const push = vi.fn();

vi.mock('vue-router', () => ({
  useRoute: () => ({
    params: { id: 1 },
    query
  }),
  useRouter: () => ({
    push
  })
}));

describe('EnketoIframe', () => {
  [
    { actionType: 'new', expected: `/enketo-passthrough/${enketoId}` },
    { actionType: 'public-link', expected: `/enketo-passthrough/single/${enketoId}` },
    { actionType: 'preview', expected: `/enketo-passthrough/preview/${enketoId}` },
  ].forEach(({ actionType, expected }) => {
    it(`renders iframe with correct src when actionType is ${actionType}`, () => {
      const component = mount(EnketoIframe, {
        props: {
          enketoId,
          form: { xmlFormId: '', projectId: 1, enketoId, state: 'open', draft: false, webformsEnabled: false },
          actionType
        }
      });
      const iframe = component.find('iframe');
      expect(iframe.exists()).to.equal(true);
      expect(iframe.attributes('src')).to.contain(expected);
    });
  });

  it('renders iframe with /single prefix when single=true query parameter for new submission', async () => {
    query = { single: 'true' };
    const component = mount(EnketoIframe, {
      props: {
        enketoId,
        form: { xmlFormId: 'a', projectId: 1, enketoId, state: 'open', draft: false, webformsEnabled: false },
        actionType: 'new'
      }
    });
    const iframe = component.find('iframe');
    expect(iframe.attributes('src')).to.contain('/enketo-passthrough/single/');
  });

  it('renders iframe without /single prefix when single=false for public-link', async () => {
    query = {
      single: 'false',
      st: 'token'
    };
    const component = mount(EnketoIframe, {
      props: {
        enketoId,
        form: { xmlFormId: 'a', projectId: 1, enketoId, state: 'open', draft: false, webformsEnabled: false },
        actionType: 'new'
      }
    });
    const iframe = component.find('iframe');
    expect(iframe.attributes('src')).to.contain(`/enketo-passthrough/${enketoId}`);
    expect(iframe.attributes('src')).to.not.contain('/single/');
  });

  // it('redirects on submissionsuccess message with return_url - internal', async () => {
  //   query = {
  //     return_url: `${window.location.origin}/projects/1`
  //   };
  //   const component = mount(EnketoIframe, {
  //     // attachTo: container,
  //     props: {
  //       enketoId,
  //       form: { xmlFormId: 'a', projectId: 1, enketoId, state: 'open', draft: false, webformsEnabled: false },
  //       actionType: 'public-link'
  //     }
  //   });
  //   const iframe = component.find('iframe');
  //   const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
  //   await postMessageToParent(iframe, data);
  //   expect(push).to.have.been.called.with('/projects/1');

  //   const wrapper = mountComponent({
  //     props: { enketoId, actionType: 'public-link' },
  //     container: {
  //       router: mockRouter(`/?return_url=${window.location.origin}/projects/1`)
  //     }
  //   });
  //   const iframe = wrapper.find('iframe');

  //   const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
  //   await postMessageToParent(iframe, data);

  //   wrapper.vm.$router.push.calledWith('/projects/1').should.be.true;
  // });

  // it('redirects on submissionsuccess message with return_url - external', async () => {
  //   const fakeAssign = sinon.fake();
  //   const wrapper = mountComponent({
  //     props: { enketoId, actionType: 'public-link' },
  //     container: {
  //       router: mockRouter('/?return_url=http://example.com/projects/1'),
  //       location: {
  //         origin: window.location.origin,
  //         assign: (url) => {
  //           fakeAssign(url);
  //         }
  //       }
  //     }
  //   });
  //   const iframe = wrapper.find('iframe');

  //   const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
  //   await postMessageToParent(iframe, data);

  //   fakeAssign.calledWith(new URL('http://example.com/projects/1')).should.be.true;
  // });

  // it('redirect on submissionsuccess for new submission when single=true', async () => {
  //   const fakeAssign = sinon.fake();
  //   const wrapper = mountComponent({
  //     props: { enketoId, actionType: 'new' },
  //     container: {
  //       router: mockRouter('/?return_url=http://example.com/projects/1&single=true'),
  //       location: {
  //         origin: window.location.origin,
  //         assign: (url) => {
  //           fakeAssign(url);
  //         }
  //       }
  //     }
  //   });
  //   const iframe = wrapper.find('iframe');

  //   const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
  //   await postMessageToParent(iframe, data);

  //   fakeAssign.called.should.be.true;
  //   fakeAssign.args[0][0].href.should.equal('http://example.com/projects/1');
  // });

  // it('does not redirect on invalid return URL', async () => {
  //   const fakeAssign = sinon.fake();
  //   const wrapper = mountComponent({
  //     props: { enketoId, actionType: 'public-link' },
  //     container: {
  //       router: mockRouter('/?return_url=example.com'), //protocol is missing
  //       location: {
  //         origin: window.location.origin,
  //         assign: (url) => {
  //           fakeAssign(url);
  //         }
  //       }
  //     }
  //   });
  //   const iframe = wrapper.find('iframe');

  //   const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
  //   await postMessageToParent(iframe, data);

  //   fakeAssign.called.should.be.false;
  //   wrapper.vm.$router.push.called.should.be.false;
  // });

  // it('does not redirect on submissionsuccess for public-link when single=false', async () => {
  //   const fakeAssign = sinon.fake();
  //   const wrapper = mountComponent({
  //     props: { enketoId, actionType: 'public-link' },
  //     container: {
  //       router: mockRouter('/?return_url=http://example.com/projects/1&single=false'),
  //       location: {
  //         origin: window.location.origin,
  //         assign: (url) => {
  //           fakeAssign(url);
  //         }
  //       }
  //     }
  //   });
  //   const iframe = wrapper.find('iframe');

  //   const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
  //   await postMessageToParent(iframe, data);

  //   fakeAssign.called.should.be.false;
  // });

  // // 'single' query parameter is false implicitly
  // it('does not redirects on submissionsuccess for new submission', async () => {
  //   const fakeAssign = sinon.fake();
  //   const wrapper = mountComponent({
  //     props: { enketoId, actionType: 'new' },
  //     container: {
  //       router: mockRouter('/?return_url=http://example.com/projects/1'),
  //       location: {
  //         origin: window.location.origin,
  //         assign: (url) => {
  //           fakeAssign(url);
  //         }
  //       }
  //     }
  //   });
  //   const iframe = wrapper.find('iframe');

  //   const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
  //   await postMessageToParent(iframe, data);

  //   fakeAssign.called.should.be.false;
  // });

  // it('bubbles up the message event', async () => {
  //   const wrapper = mountComponent({
  //     props: { enketoId, actionType: 'new', instanceId: 'test-instance' },
  //     container: {
  //       router: mockRouter(`/?parentWindowOrigin=${window.location.origin}`)
  //     }
  //   });

  //   const postMessage = sinon.fake();
  //   sinon.replace(window.parent, 'postMessage', postMessage);

  //   const iframe = wrapper.find('iframe');

  //   const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });

  //   await postMessageToParent(iframe, data);

  //   postMessage.calledWith(data, window.location.origin).should.be.true;
  // });

  // it('should not bubble up the message event if origin is different', async () => {
  //   const wrapper = mountComponent({
  //     props: { enketoId, actionType: 'new', instanceId: 'test-instance' },
  //     container: {
  //       router: mockRouter(`/?parentWindowOrigin=${window.location.origin}`),
  //       location: {
  //         origin: 'https://example.com'
  //       }
  //     }
  //   });

  //   const postMessage = sinon.fake();
  //   sinon.replace(window.parent, 'postMessage', postMessage);

  //   const iframe = wrapper.find('iframe');

  //   const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
  //   await postMessageToParent(iframe, data);

  //   postMessage.called.should.be.false;
  // });

  it('encodes spaces as %20 instead of + in query parameters', () => {
    query = { 'd[/some/path]': 'hello world' };
    const component = mount(EnketoIframe, {
      props: {
        enketoId,
        form: { xmlFormId: '', projectId: 1, enketoId, state: 'open', draft: false, webformsEnabled: false },
        actionType: 'new'
      }
    });
    const iframe = component.find('iframe');
    expect(iframe.attributes('src')).to.contain('hello%20world');
  });

  it('passes + sign as %20', () => {
    query = { 'd[/some/path]': 'hello + world' };
    const component = mount(EnketoIframe, {
      props: {
        enketoId,
        form: { xmlFormId: '', projectId: 1, enketoId, state: 'open', draft: false, webformsEnabled: false },
        actionType: 'new'
      }
    });
    const iframe = component.find('iframe');
    expect(iframe.attributes('src')).to.contain('hello%20%2B%20world');
  });
});
