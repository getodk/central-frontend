import EntityUpdate from '../../../../src/components/entity/update.vue';
import EntityUpdateRow from '../../../../src/components/entity/update/row.vue';
import TextareaAutosize from '../../../../src/components/textarea-autosize.vue';

import testData from '../../../data';
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

  describe('current value', () => {
    it('shows the value', () => {
      const row = mountComponent({
        props: { oldValue: 'foo' }
      });
      row.get('.old-value').text().should.equal('foo');
    });

    it('renders correctly if the value is an empty string', () => {
      const row = mountComponent({
        props: { oldValue: '' }
      });
      const oldValue = row.get('.old-value');
      oldValue.text().should.equal('(empty)');
      oldValue.classes('empty').should.be.true();
    });

    it('renders correctly if the value is nullish', () => {
      const row = mountComponent();
      const oldValue = row.get('.old-value');
      oldValue.text().should.equal('(empty)');
      oldValue.classes('empty').should.be.true();
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

    it('adds uncommitted-change class if modelValue prop exists', () => {
      const row = mountComponent({
        props: { oldValue: 'foo', modelValue: 'bar' }
      });
      row.classes('uncommitted-change').should.be.true();
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
      row.get('textarea').element.required.should.be.true();
    });
  });

  it('sets TextareaAutosize minHeight prop based on oldValue prop', async () => {
    testData.extendedEntities.createPast(1, {
      label: 'a',
      data: { notes: 'a'.repeat(5000) }
    });
    const modal = mount(EntityUpdate, {
      props: { state: true, entity: testData.extendedEntities.last() },
      container: {
        requestData: { dataset: testData.extendedDatasets.last() }
      },
      attachTo: document.body
    });
    await modal.vm.$nextTick();
    await modal.vm.$nextTick();
    const minHeights = modal.findAllComponents(TextareaAutosize)
      .map(textarea => textarea.props().minHeight);
    should.exist(minHeights[0]);
    minHeights[0].should.be.above(0);
    minHeights[1].should.be.above(minHeights[0]);
  });
});
