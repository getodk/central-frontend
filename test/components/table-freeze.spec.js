import TableFreeze from '../../src/components/table-freeze.vue';

import { mergeMountOptions, mount } from '../util/lifecycle';

const mountComponent = (options) =>
  mount(TableFreeze, mergeMountOptions(options, {
    props: {
      data: [{ id: 1, name: 'foo' }, { id: 1, name: 'bar' }],
      keyProp: 'id'
    },
    slots: {
      'head-frozen': '<th>id</th>',
      'head-scrolling': '<th>name</th>',
      'data-frozen': '<tr><td>{{ params.id }}</td></tr>',
      'data-scrolling': '<tr><td>{{ params.name }}</td></tr>'
    }
  }));

describe('TableFreeze', () => {
  describe('visibility of actions', () => {
    const slots = {
      'head-frozen': '<th>Actions</th>',
      'data-frozen': `<tr>
        <td>
          Hover or focus to see actions
          <div class="btn-group">
            <button type="button" class="btn btn-default">Some button</button>
          </div>
        </td>
      </tr>`
    };

    it('shows actions if user hovers over a scrolling row', async () => {
      const component = mountComponent({ slots });
      await component.get('.table-freeze-scrolling td').trigger('mouseover');
      const frozenRows = component.findAll('.table-freeze-frozen tbody tr');
      frozenRows[0].classes('scrolling-hover').should.be.true();
      frozenRows[1].classes('scrolling-hover').should.be.false();
    });

    it('toggles actions if user hovers over a new scrolling row', async () => {
      const component = mountComponent({ slots });
      const scrollingRows = component.findAll('.table-freeze-scrolling tbody tr');
      await scrollingRows[0].trigger('mouseover');
      await scrollingRows[1].trigger('mouseover');
      const frozenRows = component.findAll('.table-freeze-frozen tbody tr');
      frozenRows[0].classes('scrolling-hover').should.be.false();
      frozenRows[1].classes('scrolling-hover').should.be.true();
    });

    it('hides the actions if the cursor leaves the table', async () => {
      const component = mountComponent({ slots });
      await component.get('.table-freeze-scrolling td').trigger('mouseover');
      await component.get('.table-freeze-scrolling tbody').trigger('mouseleave');
      const frozenRow = component.get('.table-freeze-frozen tbody tr');
      frozenRow.classes('scrolling-hover').should.be.false();
    });

    it('adds a class for the actions trigger', async () => {
      const component = mountComponent({ slots, attachTo: document.body });
      const tbody = component.get('.table-freeze-frozen tbody');
      tbody.classes('actions-trigger-hover').should.be.true();
      const btn = tbody.findAll('.btn');
      await btn[0].trigger('focusin');
      tbody.classes('actions-trigger-focus').should.be.true();
      await tbody.get('td').trigger('mousemove');
      tbody.classes('actions-trigger-hover').should.be.true();
      await btn[1].trigger('focusin');
      await component.get('.table-freeze-scrolling td').trigger('mousemove');
      tbody.classes('actions-trigger-hover').should.be.true();
    });
  });
});
