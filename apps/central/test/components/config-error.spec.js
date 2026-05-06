import ConfigError from '../../src/components/config-error.vue';

import { mount } from '../util/lifecycle';

describe('ConfigError', () => {
  it('shows the error', async () => {
    const component = mount(ConfigError, {
      props: { error: new Error('foo') }
    });
    const text = component.get('.panel-body').text();
    text.should.equal('There was an error loading Central. Something went wrong: there was no request.');
  });
});
