import DisableContainer from '../../src/components/disable-container.vue';
import { mount } from '../util/lifecycle';

const mountComponent = (options = {}) =>
  mount(DisableContainer, {
    props: { disabled: false, disabledMessage: '' },
    slots: { default: '<button>Test Content</button>' },
    ...options
  });

describe('DisableContainer', () => {
  it('renders slot content', () => {
    const component = mountComponent();
    component.get('button').text().should.equal('Test Content');
  });

  describe('disabled prop', () => {
    it('shows overlay when disabled is true', () => {
      const component = mountComponent({ props: { disabled: true } });
      component.get('.disable-container-overlay').should.be.visible();
    });

    it('hides overlay when disabled is false', () => {
      const component = mountComponent({ props: { disabled: false } });
      component.get('.disable-container-overlay').should.be.hidden();
    });

    it('applies inert attribute to content when disabled', () => {
      const component = mountComponent({ props: { disabled: true } });
      const contentDiv = component.findAll('div')[2];
      contentDiv.attributes('inert').should.equal('');
    });

    it('does not apply inert attribute when not disabled', () => {
      const component = mountComponent({ props: { disabled: false } });
      const contentDiv = component.findAll('div')[2];
      should.not.exist(contentDiv.attributes('inert'));
    });
  });

  describe('disabledMessage prop', () => {
    it('shows screen reader message when disabled with message', () => {
      const component = mountComponent({
        props: { disabled: true, disabledMessage: 'This section is disabled' }
      });
      component.get('.sr-only').text().should.equal('This section is disabled');
    });

    it('does not show screen reader message when not disabled', () => {
      const component = mountComponent({
        props: { disabled: false, disabledMessage: 'This section is disabled' }
      });
      component.find('.sr-only').exists().should.be.false;
    });
  });

  describe('overlay behavior', () => {
    it('overlay has tabindex="0" for keyboard tabs', () => {
      const component = mountComponent({ props: { disabled: true } });
      component.get('.disable-container-overlay').attributes('tabindex').should.equal('0');
    });

    it('overlay has tooltip directive', async () => {
      const component = mountComponent({ props: { disabled: true, disabledMessage: 'This section is disabled' } });
      const overlay = component.get('.disable-container-overlay');
      await overlay.should.have.tooltip('This section is disabled');
    });
  });
});
