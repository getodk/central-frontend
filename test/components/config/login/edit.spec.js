import { nextTick } from 'vue';

import ConfigLoginEdit from '../../../../src/components/config/login/edit.vue';
import Spinner from '../../../../src/components/spinner.vue';

import testData from '../../../data';
import { mockHttp } from '../../../util/http';
import { mount } from '../../../util/lifecycle';

const mountOptions = () => ({
  container: {
    requestData: { serverConfig: testData.standardConfigs.byKey() }
  },
  attachTo: document.body
});
const mountComponent = () => mount(ConfigLoginEdit, mountOptions());
const focus = (wrapper) => {
  wrapper.element.focus();
  return nextTick();
};
const change = async (component, inputIndex, value, blur = true) => {
  const inputs = component.findAll('form input');
  inputs.length.should.equal(2);
  await focus(inputs[inputIndex]);
  await inputs[inputIndex].setValue(value);
  if (blur) await focus(inputs[inputIndex === 0 ? 1 : 0]);
};

describe('ConfigLoginEdit', () => {
  it('renders correctly if there is no config', () => {
    const component = mountComponent();
    const values = component.findAll('.form-control')
      .map(input => input.element.value);
    values.should.eql(['', '']);
  });

  it('renders correctly if there is a config', () => {
    testData.standardConfigs.createPast(1, {
      key: 'login-appearance',
      value: { title: 'foo', description: 'bar' }
    });
    const component = mountComponent();
    const values = component.findAll('.form-control')
      .map(input => input.element.value);
    values.should.eql(['foo', 'bar']);
  });

  it('sends a request on blur', () =>
    mockHttp()
      .mount(ConfigLoginEdit, mountOptions())
      .request(component => change(component, 0, 'foo'))
      .beforeAnyResponse(component => {
        const disabled = component.findAll('form input')
          .map(input => input.attributes('aria-disabled') === 'true');
        disabled.should.eql([true, true]);

        const spinners = component.get('form').findAllComponents(Spinner);
        const states = spinners.map(spinner => spinner.props().state);
        states.should.eql([true, false]);
      })
      .respondWithData(() => testData.standardConfigs.createNew({
        key: 'login-appearance',
        value: { title: 'foo' }
      }))
      .testRequests([{
        method: 'POST',
        url: '/v1/config/login-appearance',
        data: { title: 'foo' }
      }])
      .request(component => change(component, 1, 'bar'))
      .beforeAnyResponse(component => {
        const spinners = component.get('form').findAllComponents(Spinner);
        const states = spinners.map(spinner => spinner.props().state);
        states.should.eql([false, true]);
      })
      .respondWithData(() => testData.standardConfigs.update(-1, {
        value: { title: 'foo', description: 'bar' }
      }))
      .testRequests([{
        method: 'POST',
        url: '/v1/config/login-appearance',
        data: { title: 'foo', description: 'bar' }
      }]));

  it('omits empty values from the request', () => {
    testData.standardConfigs.createPast(1, {
      key: 'login-appearance',
      value: { title: 'foo', description: 'bar' }
    });
    return mockHttp()
      .mount(ConfigLoginEdit, mountOptions())
      .request(component => change(component, 0, ''))
      .respondWithData(() => testData.standardConfigs.update(-1, {
        value: { description: 'bar' }
      }))
      .testRequests([{
        method: 'POST',
        url: '/v1/config/login-appearance',
        data: { description: 'bar' }
      }])
      .request(component => change(component, 1, ''))
      .respondWithData(() => testData.standardConfigs.update(-1, { value: {} }))
      .testRequests([{
        method: 'POST',
        url: '/v1/config/login-appearance',
        data: {}
      }]);
  });

  it('does not send a request if nothing has changed', () => {
    testData.standardConfigs.createPast(1, {
      key: 'login-appearance',
      value: { title: 'foo' }
    });
    return mockHttp()
      .mount(ConfigLoginEdit, mountOptions())
      .testNoRequest(async (component) => {
        await change(component, 0, 'bar', false);
        await change(component, 0, 'foo');
      })
      .testNoRequest(async (component) => {
        await change(component, 1, 'bar', false);
        // Technically, there is a difference between this empty value and
        // serverConfig['login-appearance'].value.description, which is
        // `undefined`. Yet there should still be no request.
        return change(component, 1, '');
      });
  });

  it('tries again if the previous request failed', () =>
    mockHttp()
      .mount(ConfigLoginEdit, mountOptions())
      .request(component => change(component, 0, 'foo'))
      .respondWithProblem()
      .complete()
      .request(async (component) => {
        // Just focusing/blurring, not changing any values.
        const inputs = component.findAll('form input');
        await focus(inputs[0]);
        await focus(inputs[1]);
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/config/login-appearance',
        data: { title: 'foo' }
      }]));
});
