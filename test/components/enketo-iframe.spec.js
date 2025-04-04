import sinon from 'sinon';
import EnketoIframe from '../../src/components/enketo-iframe.vue';
import NotFound from '../../src/components/not-found.vue';
import { mount } from '../util/lifecycle';
import { mockRouter } from '../util/router';
import { wait } from '../util/util';

const enketoId = 'sCTIfjC5LrUto4yVXRYJkNKzP7e53vo';

const mountComponent = (props) => mount(EnketoIframe, {
  props,
  container: {
    router: mockRouter()
  },
  attachTo: document.body
});

describe('EnketoIframe', () => {
  [
    { desc: 'all null', enketoId: null, actionType: null, instanceId: null },
    { desc: 'invalid actionType', enketoId, actionType: 'delete', instanceId: null },
    { desc: 'null instanceId with edit', enketoId, actionType: 'edit', instanceId: null },
  ].forEach(t => {
    it(`renders NotFound component when props are invalid - ${t.desc}`, () => {
      const { desc, ...props } = t;
      const wrapper = mountComponent(props);
      wrapper.findComponent(NotFound).exists().should.be.true;
    });
  });

  it('should update title to Page Not Found when props are invalid', () => {
    mountComponent();
    document.title.should.match(/Page Not Found/);
  });

  it('renders iframe with correct src when props are valid', () => {
    const wrapper = mountComponent({ enketoId, actionType: 'edit', instanceId: 'test-instance' });
    const iframe = wrapper.find('iframe');
    iframe.exists().should.be.true;
    iframe.attributes('src').should.contain(`/enketo-passthrough/edit/${enketoId}?instance_id=test-instance`);
  });

  it('redirects on submissionsuccess message with return_url', async () => {
    const wrapper = mountComponent({ enketoId, actionType: 'new', instanceId: 'test-instance' });
    const iframe = wrapper.find('iframe');

    wrapper.vm.$route.query = { return_url: 'http://localhost/projects/1' };

    wrapper.vm.$router.push = sinon.fake();

    iframe.element.contentWindow.eval(`
      window.parent.postMessage(JSON.stringify({ enketoEvent: 'submissionsuccess' }), "*");
    `);

    await wait();

    wrapper.vm.$router.push.calledWith('/projects/1').should.be.true;
  });
});
