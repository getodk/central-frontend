import EntityUploadExtraProperties from '../../../../src/components/entity/upload/extra-properties.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options) =>
  mount(EntityUploadExtraProperties, mergeMountOptions(options, {
    props: { selected: new Set() }
  }));

describe('EntityUploadExtraProperties', () => {
  it('shows a checkbox for each property', async () => {
    const component = mountComponent({
      props: { properties: ['circumference', 'species'] }
    });
    const checkboxes = component.findAll('.checkbox');
    const text = checkboxes.map(div => div.text());
    text.should.eql(['Select all', 'circumference', 'species']);
    await checkboxes[1].get('span').should.have.textTooltip();
  });

  describe('selected prop', () => {
    it('sets the initial state of the checkboxes', () => {
      const component = mountComponent({
        props: { properties: ['foo', 'bar'], selected: new Set(['foo']) }
      });
      const checked = component.findAll('input').map(input => input.element.checked);
      checked.should.eql([false, true, false]);
    });

    it('checks "Select all" if all properties are selected', () => {
      const component = mountComponent({
        props: { properties: ['foo', 'bar'], selected: new Set(['foo', 'bar']) }
      });
      const checked = component.findAll('input').map(input => input.element.checked);
      checked.should.eql([true, true, true]);
    });
  });

  it('disables checkboxes if the disabled prop is true', () => {
    const component = mountComponent({
      props: { properties: ['foo', 'bar'], disabled: true }
    });
    const checkboxes = component.findAll('.checkbox');
    checkboxes.length.should.equal(3);
    for (const checkbox of checkboxes) {
      checkbox.classes('disabled').should.be.true;
      checkbox.get('input').element.disabled.should.be.true;
    }
  });

  it('emits a toggle event when a property is checked', async () => {
    const component = mountComponent({
      props: { properties: ['foo', 'bar'] }
    });
    await component.get('input[value="foo"]').setChecked();
    component.emitted().toggle.should.eql([['foo', true]]);
  });

  it('emits a toggle event when a property is unchecked', async () => {
    const component = mountComponent({
      props: { properties: ['foo', 'bar'], selected: new Set(['foo']) }
    });
    await component.get('input[value="foo"]').setChecked(false);
    component.emitted().toggle.should.eql([['foo', false]]);
  });

  describe('select all', () => {
    it('does not show the checkbox if there is only a single property', () => {
      const component = mountComponent({
        props: { properties: ['foo'] }
      });
      const checkboxes = component.findAll('.checkbox');
      checkboxes.length.should.equal(1);
      checkboxes[0].text().should.equal('foo');
    });

    it('selects every unselected property', async () => {
      const component = mountComponent({
        props: { properties: ['foo', 'bar', 'baz'], selected: new Set(['baz']) }
      });
      await component.get('input').setChecked();
      component.emitted().toggle.should.eql([['foo', true], ['bar', true]]);
    });

    it('deselects every property', async () => {
      const component = mountComponent({
        props: {
          properties: ['foo', 'bar'],
          selected: new Set(['foo', 'bar'])
        }
      });
      await component.get('input').setChecked(false);
      component.emitted().toggle.should.eql([['foo', false], ['bar', false]]);
    });
  });
});
