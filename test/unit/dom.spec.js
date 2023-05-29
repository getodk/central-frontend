import { markRowChanged, markRowsChanged, px, requiredLabel, styleBox } from '../../src/util/dom';

import { mount } from '../util/lifecycle';
import { wait } from '../util/util';

describe('util/dom', () => {
  describe('px()', () => {
    it("appends 'px' to a number", () => {
      px(1).should.equal('1px');
    });
  });

  describe('styleBox()', () => {
    it('converts px styles to numbers', () => {
      const box = styleBox({
        paddingTop: '1px',
        borderRightWidth: '2px',
        marginBottom: '3.14px'
      });
      box.paddingTop.should.equal(1);
      box.borderRight.should.equal(2);
      box.marginBottom.should.equal(3.14);
    });

    it('returns 0 for an empty style property', () => {
      styleBox({ paddingTop: '' }).paddingTop.should.equal(0);
    });
  });

  describe('requiredLabel()', () => {
    it('appends * to the text if required is true', () => {
      requiredLabel('My Label', true).should.equal('My Label *');
    });

    it('does not append * if required is false', () => {
      requiredLabel('My Label', false).should.equal('My Label');
    });
  });

  describe('markRowChanged(), markRowsChanged()', () => {
    it('toggles data-mark-rows-changed for a single row', async () => {
      const table = mount({
        template: `<table>
          <tbody>
            <tr><td>foo</td></tr>
          </tbody>
        </table>`
      });
      const row = table.get('tr').element;
      markRowChanged(row);
      row.dataset.markRowsChanged.should.equal('true');
      await wait();
      row.dataset.markRowsChanged.should.equal('false');
    });

    it('toggles data-mark-rows-changed for multiple rows', async () => {
      const table = mount({
        template: `<table>
          <tbody>
            <tr><td>foo</td></tr>
            <tr><td>bar</td></tr>
          </tbody>
        </table>`
      });
      const rows = table.findAll('tr').map(row => row.element);
      markRowsChanged(rows);
      rows[0].dataset.markRowsChanged.should.equal('true');
      rows[1].dataset.markRowsChanged.should.equal('true');
      await wait();
      rows[0].dataset.markRowsChanged.should.equal('false');
      rows[1].dataset.markRowsChanged.should.equal('false');
    });
  });
});
