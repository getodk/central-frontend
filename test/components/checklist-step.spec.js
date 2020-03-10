import ChecklistStep from '../../src/components/checklist-step.vue';
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
    it('uses a slot named title', () => {
      const component = mount(ChecklistStep, {
        propsData: { stage: 'complete' },
        slots: {
          title: { render: (createElement) => createElement('span', 'Title') }
        }
      });
      const spans = component.find('.checklist-step-heading span');
      spans.length.should.equal(2);
      spans[1].text().should.equal('Title');
    });

    it('uses a default slot', () => {
      const component = mount(ChecklistStep, {
        propsData: { stage: 'complete' },
        slots: {
          default: {
            render: (createElement) => createElement('p', 'Description')
          }
        }
      });
      const p = component.find('p');
      p.length.should.equal(2);
      p[1].text().should.equal('Description');
    });
  });
});
