import FormEditSection from '../../../../src/components/form/edit/section.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(FormEditSection, mergeMountOptions(options, {
    props: { icon: 'star' },
    slots: { title: 'Some title', subtitle: 'Some subtitle', body: 'Some body' }
  }));

describe('FormEditSection', () => {
  it('shows a warning icon if the warning prop is true', () => {
    const component = mountComponent({
      props: { warning: true }
    });
    component.find('.icon-warning').exists().should.be.true;
  });
});
