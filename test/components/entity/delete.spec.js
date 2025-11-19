import EntityDelete from '../../../src/components/entity/delete.vue';

import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(EntityDelete, mergeMountOptions(options, {
    props: { state: true, label: 'Default label' }
  }));

describe('EntityDelete', () => {
  it('shows the entity label', () => {
    const modal = mountComponent({
      props: { entity: { label: 'My Entity' } }
    });
    modal.get('.modal-title').text().should.equal('Delete My Entity');
    modal.get('.modal-introduction').text().should.include('My Entity');
  });
});
