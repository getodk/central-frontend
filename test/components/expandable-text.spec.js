import { nextTick } from 'vue';

import ExpandableText from '../../src/components/expandable-text.vue';

import { truncatesText } from '../../src/util/dom';

import { mount } from '../util/lifecycle';
import { waitUntil } from '../util/util';

const mountComponent = async (slot) => {
  const component = mount(ExpandableText, {
    slots: { default: slot },
    attachTo: document.body
  });
  // Wait for the DOM to update after setTruncated() has been called in the
  // component.
  await nextTick();
  return component;
};

describe('ExpandableText', () => {
  it('truncates long text', async () => {
    const component = await mountComponent('foo '.repeat(1000));
    truncatesText(component.element).should.be.true;
    component.classes('toggleable').should.be.true;
    expect(component.attributes('tabindex')).to.equal('0');
  });

  it('does not truncate short text', async () => {
    const component = await mountComponent('foo');
    truncatesText(component.element).should.be.false;
    component.classes('toggleable').should.be.false;
    should.not.exist(component.attributes('tabindex'));
  });

  it('toggles long text on click', async () => {
    const component = await mountComponent('foo '.repeat(1000));
    component.classes('expanded').should.be.false;

    const initialHeight = component.element.clientHeight;
    let resizeCount = 0;
    new ResizeObserver(() => { resizeCount += 1; }).observe(component.element);

    await component.trigger('click');
    component.element.clientHeight.should.be.above(initialHeight);
    // Make sure the component's ResizeObserver has time to run, since it's what
    // calls setTruncated().
    await waitUntil(() => resizeCount === 1);
    component.classes('expanded').should.be.true;
    truncatesText(component.element).should.be.false;
    component.classes('toggleable').should.be.true;

    await component.trigger('click');
    component.element.clientHeight.should.equal(initialHeight);
    await waitUntil(() => resizeCount === 2);
    component.classes('expanded').should.be.false;
    truncatesText(component.element).should.be.true;
    component.classes('toggleable').should.be.true;
  });
});
