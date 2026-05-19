import { last } from 'ramda';

import EntityDelete from '../../../src/components/entity/delete.vue';

import testData from '../../data';
import { mergeMountOptions, mount } from '../../util/lifecycle';

const mountComponent = (options = undefined) =>
  mount(EntityDelete, mergeMountOptions(options, {
    props: { state: true, entity: last(testData.entityOData().value) }
  }));

describe('EntityDelete', () => {
  it('shows the entity label', () => {
    testData.extendedEntities.createPast(1, { label: 'My Entity' });
    const modal = mountComponent();
    modal.get('.modal-title').text().should.equal('Delete My Entity');
    modal.get('.modal-introduction').text().should.include('My Entity');
  });
});
