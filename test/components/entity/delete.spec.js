import EntityDelete from '../../../src/components/entity/delete.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) => {
  const entity = testData.extendedEntities.last();
  return mount(EntityDelete, mergeMountOptions(options, {
    props: {
      state: true,
      uuid: entity.uuid,
      label: entity.currentVersion.label
    }
  }));
};

describe('EntityDelete', () => {
  it('shows the entity label', () => {
    testData.extendedEntities.createPast(1, { label: 'My Entity' });
    const modal = mountComponent();
    modal.get('.modal-title').text().should.equal('Delete My Entity');
    modal.get('.modal-introduction').text().should.containEql('My Entity');
  });

  it('focuses the checkbox', () => {
    testData.extendedEntities.createPast(1);
    const modal = mountComponent({ attachTo: document.body });
    modal.get('input').should.be.focused();
  });

  it('resets the checkbox after the modal is hidden', async () => {
    testData.extendedEntities.createPast(1);
    const modal = mountComponent();
    const input = modal.get('input');
    input.element.checked.should.be.false();
    await input.setChecked();
    await modal.setProps({ state: false });
    await modal.setProps({ state: true });
    input.element.checked.should.be.false();
  });
});
