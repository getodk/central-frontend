import CustomPropsDataRow from '../../src/components/custom-props-data-row.vue';

import { mount } from '../util/lifecycle';

const mountComponent = (props) => mount(CustomPropsDataRow, { props });

describe('CustomPropsDataRow', () => {
  it('displays property values from actor.properties', () => {
    const component = mountComponent({
      actor: { id: 1, properties: { region: 'North', department: 'Health' } },
      properties: [{ name: 'region' }, { name: 'department' }]
    });
    const tds = component.findAll('td');
    tds[0].text().should.equal('North');
    tds[1].text().should.equal('Health');
  });

  it('shows empty string when property value does not exist', () => {
    const component = mountComponent({
      actor: { id: 1, properties: {} },
      properties: [{ name: 'region' }]
    });
    component.get('td').text().should.equal('');
  });
});
