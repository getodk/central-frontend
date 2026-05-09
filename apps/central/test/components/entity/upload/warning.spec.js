import { nextTick } from 'vue';

import EntityUploadWarning from '../../../../src/components/entity/upload/warning.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(EntityUploadWarning, mergeMountOptions(options, {
    slots: { default: 'Some warning:' }
  }));

describe('EntityUploadWarning', () => {
  it('lists and formats row ranges', async () => {
    const component = mountComponent({
      props: { ranges: [[1, 1], [1000, 1001]] }
    });
    // Wait for I18nList to finish rendering.
    await nextTick();
    component.get('.i18n-list').text().should.equal('1, 1,000–1,001');
  });

  it('renders a link for each range', async () => {
    const component = mountComponent({
      props: { ranges: [[1, 1], [2, 3]] }
    });
    const a = component.findAll('a');
    a.length.should.equal(2);
    await a[0].trigger('click');
    await a[1].trigger('click');
    component.emitted().rows.should.eql([[[0, 0]], [[1, 2]]]);
  });
});
