import EntityUploadExtraProperties from '../../../../src/components/entity/upload/extra-properties.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = (options) => mount(EntityUploadExtraProperties, options);

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

  it('emits a toggle event when a property is checked or unchecked', async () => {
    const component = mountComponent({
      props: { properties: ['foo', 'bar'] }
    });
    const checkbox = component.get('.checkbox:nth-child(2)');
    checkbox.text().should.equal('foo');
    await checkbox.get('input').setChecked();
    await checkbox.get('input').setChecked(false);
    component.emitted().toggle.should.eql([['foo', true], ['foo', false]]);
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

    it('toggles each property', async () => {
      const component = mountComponent({
        props: { properties: ['foo', 'bar'] }
      });
      const inputs = component.findAll('input');
      inputs.length.should.equal(3);

      await inputs[0].setChecked();
      inputs[1].element.checked.should.be.true;
      inputs[2].element.checked.should.be.true;
      component.emitted().toggle.should.eql([['foo', true], ['bar', true]]);

      await inputs[0].setChecked(false);
      inputs[1].element.checked.should.be.false;
      inputs[2].element.checked.should.be.false;
      component.emitted().toggle.should.eql([
        ['foo', true], ['bar', true],
        ['foo', false], ['bar', false]
      ]);
    });
  });
});
