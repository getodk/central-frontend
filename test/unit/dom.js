import { px, requiredLabel, styleBox } from '../../src/util/dom';

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
});
