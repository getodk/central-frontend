import EntityUpdateRow from '../../../../src/components/entity/update/row.vue';
import TextareaAutosize from '../../../../src/components/textarea-autosize.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(EntityUpdateRow, mergeMountOptions(options, {
    props: { label: 'my_property' }
  }));

describe('EntityUpdateRow', () => {
  describe('label', () => {
    it('uses the label prop', async () => {
      const row = mountComponent({
        props: { label: 'Some Label' }
      });
      const label = row.get('label');
      label.text().should.equal('Some Label');
      await label.should.have.a.textTooltip();
    });

    it('is associated with the textarea', () => {
      const row = mountComponent();
      const id = row.get('textarea').attributes('id');
      id.should.match(/^entity-update-row-textarea\d+$/);
      row.get('label').attributes('for').should.equal(id);
    });
  });

  describe('textarea value', () => {
    it('initializes the textarea with the current value', () => {
      const row = mountComponent({
        props: { oldValue: 'foo' }
      });
      row.getComponent(TextareaAutosize).props().modelValue.should.equal('foo');
    });

    it('passes an empty string to TextareaAutosize if current value is nullish', () => {
      const row = mountComponent();
      row.getComponent(TextareaAutosize).props().modelValue.should.equal('');
    });

    it('emits an update:modelValue event after textarea input', async () => {
      const row = mountComponent({
        props: { oldValue: 'foo' }
      });
      await row.get('textarea').setValue('bar');
      row.emitted('update:modelValue').should.eql([['bar']]);
    });

    it('passes the modelValue prop to the TextareaAutosize component', () => {
      const row = mountComponent({
        props: { oldValue: 'foo', modelValue: 'bar' }
      });
      row.getComponent(TextareaAutosize).props().modelValue.should.equal('bar');
    });

    it('emits undefined if current and updated values are equal', async () => {
      const row = mountComponent({
        props: { oldValue: 'foo' }
      });
      await row.get('textarea').setValue('bar');
      await row.setProps({ modelValue: 'bar' });
      await row.get('textarea').setValue('foo');
      row.emitted('update:modelValue').should.eql([['bar'], [undefined]]);
    });

    it('emits undefined if current value is nullish and updated value is empty string', async () => {
      const row = mountComponent();
      await row.get('textarea').setValue('bar');
      await row.setProps({ modelValue: 'bar' });
      await row.get('textarea').setValue('');
      row.emitted('update:modelValue').should.eql([['bar'], [undefined]]);
    });

    it('adds value-changed class if markValueChanged provided and modelValue prop exists', () => {
      const row = mountComponent({
        props: { oldValue: 'foo', modelValue: 'bar', markValueChanged: true }
      });
      row.get('.form-group').classes('value-changed').should.be.true;
    });

    it('does not add value-changed class if markValueChanged not provided but modelValue prop exists', () => {
      const row = mountComponent({
        props: { oldValue: 'foo', modelValue: 'bar' }
      });
      row.get('.form-group').classes('value-changed').should.be.false;
    });
  });

  describe('required prop is true', () => {
    it('appends * to the label', () => {
      const row = mountComponent({
        props: { label: 'Some Label', required: true }
      });
      row.get('label').text().should.equal('Some Label *');
    });

    it('makes the textarea required', () => {
      const row = mountComponent({
        props: { required: true }
      });
      row.get('textarea').element.required.should.be.true;
    });
  });
});
