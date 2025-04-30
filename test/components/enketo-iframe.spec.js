import sinon from 'sinon';
import EnketoIframe from '../../src/components/enketo-iframe.vue';
import { mergeMountOptions, mount } from '../util/lifecycle';
import { mockRouter } from '../util/router';
import { wait } from '../util/util';
import { testRequestData } from '../util/request-data';
import testData from '../data';

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

  it('renders iframe with correct src when actionType is edit', () => {
    const wrapper = mountComponent({
      props: { actionType: 'edit', instanceId: 'test-instance' }
    });
    const iframe = wrapper.find('iframe');
    iframe.exists().should.be.true;
    iframe.attributes('src').should.contain(`/enketo-passthrough/edit/${enketoId}`);
    iframe.attributes('src').should.contain('instance_id=test-instance');
  });

  it('passes all query parameters except return_url to the iframe', () => {
    const wrapper = mountComponent({
      props: { actionType: 'edit', instanceId: 'test-instance' },
      container: {
        router: mockRouter('/?return_url=http%3A%2F%2Flocalhost%2Fprojects%2F1&d[/data/first_name]=john')
      }
    });
    const iframe = wrapper.find('iframe');
    iframe.exists().should.be.true;

    iframe.attributes('src').should.not.contain('return_url');
    iframe.attributes('src').should.contain('instance_id=test-instance');
    iframe.attributes('src').should.contain(`${encodeURIComponent('d[/data/first_name]')}=john`);
  });

  it('redirects to Submission details page after edit', async () => {
    testData.extendedForms.createPast(1, { xmlFormId: 'a', webformsEnabled: true });

    const wrapper = mountComponent({
      props: { enketoId, actionType: 'edit', instanceId: 'test-instance' },
      container: {
        router: mockRouter('/'),
        requestData: testRequestData([], {
          form: testData.extendedForms.last()
        }),
      }
    });
    const iframe = wrapper.find('iframe');
    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);

    wrapper.vm.$router.push.calledWith('/projects/1/forms/a/submissions/test-instance').should.be.true;
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
});


