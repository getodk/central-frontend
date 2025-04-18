import sinon from 'sinon';
import EnketoIframe from '../../src/components/enketo-iframe.vue';
import { mergeMountOptions, mount } from '../util/lifecycle';
import { mockRouter } from '../util/router';
import { wait } from '../util/util';

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

describe('EnketoIframe', () => {
  [
    { actionType: 'new', expected: `/enketo-passthrough/${enketoId}` },
    { actionType: 'public-link', expected: `/enketo-passthrough/single/${enketoId}` },
    { actionType: 'preview', expected: `/enketo-passthrough/preview/${enketoId}` },
    { actionType: 'offline', expected: `/enketo-passthrough/x/${enketoId}` },
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

  it('redirects on submissionsuccess message with return_url', async () => {
    const wrapper = mountComponent({
      props: { actionType: 'new', instanceId: 'test-instance' },
      container: {
        router: mockRouter('/?return_url=http%3A%2F%2Flocalhost%2Fprojects%2F1')
      }
    });
    const iframe = wrapper.find('iframe');

    const script = document.createElement('script');
    script.textContent = `
      window.parent.postMessage(JSON.stringify({ enketoEvent: 'submissionsuccess' }), "*");
    `;
    iframe.element.contentDocument.body.appendChild(script);

    await wait();

    wrapper.vm.$router.push.calledWith('/projects/1').should.be.true;
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
    const script = document.createElement('script');
    script.textContent = `window.parent.postMessage('${data}', "*");`;
    iframe.element.contentDocument.body.appendChild(script);

    await wait();

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
    const script = document.createElement('script');
    script.textContent = `window.parent.postMessage('${data}', "*");`;
    iframe.element.contentDocument.body.appendChild(script);

    await wait();

    postMessage.called.should.be.false;
  });
});
