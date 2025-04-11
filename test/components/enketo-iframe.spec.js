import sinon from 'sinon';
import EnketoIframe from '../../src/components/enketo-iframe.vue';
import NotFound from '../../src/components/not-found.vue';
import { mergeMountOptions, mount } from '../util/lifecycle';
import { mockRouter } from '../util/router';
import { wait } from '../util/util';

const enketoId = 'sCTIfjC5LrUto4yVXRYJkNKzP7e53vo';

const mountComponent = (options) =>
  mount(EnketoIframe, mergeMountOptions(options, {
    container: {
      router: mockRouter()
    },
    attachTo: document.body
  }));

describe('EnketoIframe', () => {
  [
    { desc: 'all null', enketoId: null, actionType: null, instanceId: null },
    { desc: 'invalid actionType', enketoId, actionType: 'delete', instanceId: null },
    { desc: 'null instanceId with edit', enketoId, actionType: 'edit', instanceId: null },
  ].forEach(t => {
    it(`renders NotFound component when props are invalid - ${t.desc}`, () => {
      const { desc, ...props } = t;
      const wrapper = mountComponent({ props });
      wrapper.findComponent(NotFound).exists().should.be.true;
    });
  });

  it('should update title to Page Not Found when props are invalid', () => {
    mountComponent();
    document.title.should.match(/Page Not Found/);
  });

  it('renders iframe with correct src when props are valid', () => {
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'edit', instanceId: 'test-instance' }
    });
    const iframe = wrapper.find('iframe');
    iframe.exists().should.be.true;
    iframe.attributes('src').should.contain(`/enketo-passthrough/edit/${enketoId}`);
    iframe.attributes('src').should.contain('instance_id=test-instance');
  });

  it('passes all query parameters except return_url to the iframe', () => {
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'edit', instanceId: 'test-instance' },
      container: {
        router: mockRouter('/?return_url=http%3A%2F%2Flocalhost%2Fprojects%2F1&d[/data/first_name]=john')
      }
    });
    const iframe = wrapper.find('iframe');
    iframe.exists().should.be.true;

    iframe.attributes('src').should.contain('instance_id=test-instance');
    iframe.attributes('src').should.contain(`${encodeURIComponent('d[/data/first_name]')}=john`);
  });

  it('redirects on submissionsuccess message with return_url', async () => {
    const wrapper = mountComponent({
      props: { enketoId, actionType: 'new', instanceId: 'test-instance' },
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
});
