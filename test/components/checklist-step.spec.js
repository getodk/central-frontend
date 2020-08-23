import ChecklistStep from '../../src/components/checklist-step.vue';
import TestUtilP from '../util/components/p.vue';
import TestUtilSpan from '../util/components/span.vue';
import { mount } from '../util/lifecycle';

describe('ChecklistStep', () => {
  describe('class', () => {
    it('has the correct class for a step marked as complete', () => {
      const component = mount(ChecklistStep, {
        propsData: { stage: 'complete' }
      });
      component.hasClass('checklist-step-complete').should.be.true();
    });

    it('has the correct class for a step marked as a current step', () => {
      const component = mount(ChecklistStep, {
        propsData: { stage: 'current' }
      });
      component.hasClass('checklist-step-current').should.be.true();
    });

    it('has the correct class for a step marked as a later step', () => {
      const component = mount(ChecklistStep, {
        propsData: { stage: 'later' }
      });
      component.hasClass('checklist-step-later').should.be.true();
    });
  });

  describe('slots', () => {
    it('uses the title slot', () => {
      const component = mount(ChecklistStep, {
        propsData: { stage: 'complete' },
        slots: { title: TestUtilSpan }
      });
      component.first('.heading span').text().should.equal('Some span text');
    });

    it('uses the default slot', () => {
      const component = mount(ChecklistStep, {
        propsData: { stage: 'complete' },
        slots: { default: TestUtilP }
      });
      const p = component.find('p');
      p.length.should.equal(2);
      p[1].text().should.equal('Some p text');
    });
  });
});
