import { rowChanged, rowsChanged } from '../../src/composables/row-changed';

import RowChanged from '../util/components/row-changed.vue';

import { mount } from '../util/lifecycle';
import { wait } from '../util/util';

describe('useRowChanged()', () => {
  it('toggles data-use-row-changed for a single row', async () => {
    const table = mount(RowChanged, {
      props: { rowCount: 1 }
    });
    const row = table.get('tr').element;
    row.dataset.useRowChanged.should.equal('false');
    rowChanged(row);
    row.dataset.useRowChanged.should.equal('true');
    await wait();
    row.dataset.useRowChanged.should.equal('false');
  });

  it('toggles data-use-row-changed for multiple rows', async () => {
    const table = mount(RowChanged, {
      props: { rowCount: 2 }
    });
    const rows = table.findAll('tr').map(wrapper => wrapper.element);
    rowsChanged(rows);
    rows[0].dataset.useRowChanged.should.equal('true');
    rows[1].dataset.useRowChanged.should.equal('true');
    await wait();
    rows[0].dataset.useRowChanged.should.equal('false');
    rows[1].dataset.useRowChanged.should.equal('false');
  });
});
