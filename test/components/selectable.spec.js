import TestUtilSelectable from '../util/components/selectable.vue';
import { mount } from '../util/lifecycle';
import { trigger } from '../util/event';

describe('Selectable', () => {
  it('uses the default slot', () => {
    const component = mount(TestUtilSelectable, {
      propsData: { text: 'Some text' }
    });
    component.text().should.equal('Some text');
  });

  it('selects the text after it is clicked', async () => {
    const component = mount(TestUtilSelectable, {
      propsData: { text: 'Some text' },
      attachToDocument: true
    });
    await trigger.click(component);
    const selection = window.getSelection();
    selection.anchorNode.should.equal(component.vm.$el);
    selection.focusNode.should.equal(component.vm.$el);
  });
});
