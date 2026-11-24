import { faker } from '@faker-js/faker';

import EntityUploadRowCounts from '../../../../src/components/entity/upload/row-counts.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = (options) => mount(EntityUploadRowCounts, options);

describe('EntityUploadRowCounts', () => {
  it('shows the correct text when there are only new entities', () => {
    const entities = new Array(1000).fill({ label: 'dogwood', data: {} });
    const component = mountComponent({
      props: { entities }
    });
    component.get('p').text().should.equal('1,000 rows will be created.');
  });

  it('shows the correct text when there are only updates', () => {
    const entities = [];
    for (let i = 0; i < 1000; i += 1)
      entities.push({ uuid: faker.string.uuid(), label: 'dogwood', data: {} });
    const component = mountComponent({
      props: { entities }
    });
    component.get('p').text().should.equal('1,000 rows will be updated.');
  });

  it('shows the correct text when there are both new entities and updates', () => {
    const entities = [
      { label: 'dogwood', data: {} },
      { uuid: faker.string.uuid(), label: 'elm', data: {} }
    ];
    const component = mountComponent({
      props: { entities }
    });
    const text = component.get('p').text();
    text.should.equal('1 row will be updated. 1 row will be created.');
  });
});
