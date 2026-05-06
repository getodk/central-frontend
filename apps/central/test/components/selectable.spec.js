import TestUtilSelectable from '../util/components/selectable.vue';

import { mount } from '../util/lifecycle';

describe('Selectable', () => {
  it('uses the default slot', () => {
    const component = mount(TestUtilSelectable, {
      props: { text: 'Some text' }
    });
    component.text().should.equal('Some text');
  });

  it('selects the text after it is clicked', async () => {
    const component = mount(TestUtilSelectable, {
      props: { text: 'Some text' },
      attachTo: document.body
    });
    await component.trigger('click');
    const selection = window.getSelection();
    selection.anchorNode.should.equal(component.element);
    selection.focusNode.should.equal(component.element);
  });
});
