import ConfigLoginEdit from '../../../../src/components/config/login/edit.vue';

import testData from '../../../data';
import { mockHttp } from '../../../util/http';
import { mount } from '../../../util/lifecycle';

const mountOptions = () => ({
  container: {
    requestData: { serverConfig: testData.standardConfigs.byKey() }
  }
});
const mountComponent = () => mount(ConfigLoginEdit, mountOptions());

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

  it('sends the correct request', () =>
    mockHttp()
      .mount(ConfigLoginEdit, mountOptions())
      .request(async (component) => {
        const form = component.get('form');
        const inputs = form.findAll('.form-control');
        inputs.length.should.equal(2);
        await inputs[0].setValue('foo');
        await inputs[1].setValue('bar');
        return form.trigger('submit');
      })
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/config/login-appearance',
        data: { title: 'foo', description: 'bar' }
      }]));

  it('omits empty values from the request', () =>
    mockHttp()
      .mount(ConfigLoginEdit, mountOptions())
      .request(component => component.get('form').trigger('submit'))
      .respondWithProblem()
      .testRequests([{
        method: 'POST',
        url: '/v1/config/login-appearance',
        data: {}
      }]));

  describe('after a successful response', () => {
    const submit = () => mockHttp()
      .mount(ConfigLoginEdit, mountOptions())
      .request(async (component) => {
        const form = component.get('form');
        const inputs = form.findAll('.form-control');
        inputs.length.should.equal(2);
        await inputs[0].setValue('foo');
        await inputs[1].setValue('bar');
        return form.trigger('submit');
      })
      .respondWithData(() => testData.standardConfigs.createNew({
        key: 'login-appearance',
        value: { title: 'foo', description: 'bar' }
      }));

    it('shows a toast message', async () => {
      const component = await submit();
      component.should.toast('Settings successfully saved.');
    });
  });
});
