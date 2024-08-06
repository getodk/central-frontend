import EntityDelete from '../../../src/components/entity/delete.vue';

import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(EntityDelete, mergeMountOptions(options, {
    props: { state: true, checkbox: true, label: 'Default label' }
  }));

describe('EntityDelete', () => {
  it('shows the entity label', () => {
    const modal = mountComponent({
      props: { label: 'My Entity' }
    });
    modal.get('.modal-title').text().should.equal('Delete My Entity');
    modal.get('.modal-introduction').text().should.include('My Entity');
  });

  it('focuses the checkbox', () => {
    const modal = mountComponent({ attachTo: document.body });
    modal.get('input').should.be.focused();
  });

  it('resets the checkbox after the modal is hidden', async () => {
    const modal = mountComponent();
    const input = modal.get('input');
    input.element.checked.should.be.false;
    await input.setChecked();
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    input.element.checked.should.be.false;
  });

  it('does not render the checkbox if the checkbox prop is false', () => {
    const modal = mountComponent({
      props: { checkbox: false }
    });
    modal.find('input').exists().should.be.false;
  });
});
