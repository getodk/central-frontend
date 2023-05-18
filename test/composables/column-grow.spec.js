import ColumnGrow from '../util/components/column-grow.vue';

import { mount } from '../util/lifecycle';

const mountComponent = (props) => mount(ColumnGrow, {
  props,
  attachTo: document.body
});
const widths = (table) =>
  table.findAll('th').map(th => th.element.getBoundingClientRect().width);

describe('useColumnGrow()', () => {
  it('grows the width of the column up to its content width', () => {
    const table = mountComponent({ contentWidth: 40, grow: 2 });
    widths(table).should.eql([40, 20, 40]);
  });

  it('does not grow beyond the content width', () => {
    const table = mountComponent({ contentWidth: 30, grow: 2 });
    widths(table).should.eql([30, 20, 50]);
  });

  it('does not grow beyond the growth factor', () => {
    const table = mountComponent({ contentWidth: 60, grow: 2 });
    widths(table).should.eql([40, 20, 40]);
  });

  it('does not shrink if there is no content', () => {
    const table = mountComponent({ contentWidth: 0, grow: 2 });
    widths(table).should.eql([20, 20, 60]);
  });

  it('does not grow if the growth factor is 1', () => {
    const table = mountComponent({ contentWidth: 40, grow: 1 });
    widths(table).should.eql([20, 20, 60]);
  });

  it('sizes the column if it is mounted after the component', async () => {
    // Mount the component, but don't mount the table element.
    const table = mountComponent({ contentWidth: 40, grow: 2, render: false });
    // Now mount the table element.
    await table.setProps({ render: true });
    widths(table).should.eql([40, 20, 40]);
  });

  it('does not resize the column after it becomes visible', async () => {
    const table = mountComponent({ contentWidth: 40, grow: 2, visible: false });
    widths(table).should.eql([0, 0, 0]);
    await table.setProps({ visible: true });
    widths(table).should.eql([20, 20, 60]);
  });

  it('resizes the column after resize() is called', async () => {
    const table = mountComponent({ contentWidth: 40, grow: 2, visible: false });

    // Resize after the table becomes visible.
    await table.setProps({ visible: true });
    table.vm.resize();
    widths(table).should.eql([40, 20, 40]);

    // Resize after the table's content changes.
    await table.setProps({ contentWidth: 30 });
    table.vm.resize();
    widths(table).should.eql([30, 20, 50]);
  });
});
