import Multiselect from '../../../../src/components/multiselect.vue';
import SubmissionFiltersReviewState from '../../../../src/components/submission/filters/review-state.vue';

import { mergeMountOptions, mount } from '../../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(SubmissionFiltersReviewState, mergeMountOptions(options, {
    props: { modelValue: ['null'] }
  }));
const toggle = (multiselect) => multiselect.get('select').trigger('click');

describe('SubmissionFiltersReviewState', () => {
  it('renders the correct options', () => {
    mountComponent().getComponent(Multiselect).props().options.should.eql([
      { value: 'null', text: 'Received' },
      { value: "'hasIssues'", text: 'Has issues' },
      { value: "'edited'", text: 'Edited' },
      { value: "'approved'", text: 'Approved' },
      { value: "'rejected'", text: 'Rejected' }
    ]);
  });

  it('passes the modelValue prop to the Multiselect', () => {
    const component = mountComponent({
      props: { modelValue: ['null', "'approved'"] }
    });
    const multiselect = component.getComponent(Multiselect);
    multiselect.props().modelValue.should.eql(['null', "'approved'"]);
  });

  it('passes a new value for modelValue prop to Multiselect', async () => {
    const component = mountComponent({
      props: { modelValue: ['null', "'approved'"] }
    });
    await component.setProps({ modelValue: ['null'] });
    component.getComponent(Multiselect).props().modelValue.should.eql(['null']);
  });

  it('passes up an update:modelValue event from the Multiselect', async () => {
    const component = mountComponent({
      props: { modelValue: ['null', "'approved'"] },
      attachTo: document.body
    });
    const multiselect = component.getComponent(Multiselect);
    await toggle(multiselect);
    await multiselect.get('input[type="checkbox"]').setValue(false);
    await toggle(multiselect);
    multiselect.emitted('update:modelValue').should.eql([[["'approved'"]]]);
    component.emitted('update:modelValue').should.eql([[["'approved'"]]]);
  });

  describe('no review states are selected', () => {
    const all = ['null', "'hasIssues'", "'edited'", "'approved'", "'rejected'"];

    it('falls back to all review states', async () => {
      const component = mountComponent({
        props: { modelValue: ['null'] },
        attachTo: document.body
      });
      const multiselect = component.getComponent(Multiselect);
      await toggle(multiselect);
      await multiselect.get('.select-none').trigger('click');
      await toggle(multiselect);
      multiselect.emitted('update:modelValue').should.eql([[[]]]);
      component.emitted('update:modelValue').should.eql([[all]]);
    });

    describe('all review states were already selected', () => {
      it('does not emit an event', async () => {
        const component = mountComponent({
          props: { modelValue: all },
          attachTo: document.body
        });
        const multiselect = component.getComponent(Multiselect);
        await toggle(multiselect);
        await multiselect.get('.select-none').trigger('click');
        await toggle(multiselect);
        multiselect.emitted('update:modelValue').should.eql([[[]]]);
        should.not.exist(component.emitted('update:modelValue'));
      });

      it('updates the Multiselect', async () => {
        const component = mountComponent({
          props: { modelValue: all },
          attachTo: document.body
        });
        const multiselect = component.getComponent(Multiselect);
        await toggle(multiselect);
        await multiselect.get('.select-none').trigger('click');
        await toggle(multiselect);
        multiselect.props().modelValue.should.eql(all);
        await toggle(multiselect);
        const inputs = multiselect.findAll('input[type="checkbox"]:checked');
        inputs.length.should.equal(5);
      });
    });
  });
});
