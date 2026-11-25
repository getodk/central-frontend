import EntityUploadRowCounts from '../../../../src/components/entity/upload/row-counts.vue';

import { mount } from '../../../util/lifecycle';

const mountComponent = (options) => mount(EntityUploadRowCounts, options);

describe('EntityUploadRowCounts', () => {
  it('shows the correct text when there are only new entities', () => {
    const component = mountComponent({
      props: { created: 1000, updated: 0 }
    });
    component.get('p').text().should.equal('1,000 rows will be created.');
  });

  it('shows the correct text when there are only updates', () => {
    const component = mountComponent({
      props: { created: 0, updated: 1000 }
    });
    component.get('p').text().should.equal('1,000 rows will be updated.');
  });

  it('shows the correct text when there are both new entities and updates', () => {
    const component = mountComponent({
      props: { created: 1, updated: 1 }
    });
    const text = component.get('p').text();
    text.should.equal('1 row will be updated. 1 row will be created.');
  });
});
