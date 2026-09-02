import EntityUploadPropertyList from '../../../../src/components/entity/upload/property-list.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = (options) => mount(EntityUploadPropertyList, options);

describe('EntityUploadPropertyList', () => {
  it('renders an item for each property', async () => {
    const component = mountComponent({
      props: { names: ['my_property', 'another_property'] }
    });
    const li = component.findAll('li');
    const text = li.map(wrapper => wrapper.text());
    text.should.eql(['my_property', 'another_property']);
    await li[0].get('span').should.have.textTooltip();
  });
});
