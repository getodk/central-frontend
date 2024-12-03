import { nextTick, watch } from 'vue';

import createHoverCard from '../../src/container/hover-card';

describe('createHoverCard()', () => {
  it('updates after the hover card is shown', () => {
    const hoverCard = createHoverCard();
    hoverCard.show(document.body, 'foo', { bar: 'baz' });
    hoverCard.state.should.be.true;
    hoverCard.anchor.should.equal(document.body);
    hoverCard.type.should.equal('foo');
    expect(hoverCard.data).to.eql({ bar: 'baz' });
  });

  it('updates after the hover card is hidden', () => {
    const hoverCard = createHoverCard();
    hoverCard.show(document.body, 'foo', { bar: 'baz' });
    hoverCard.hide();
    hoverCard.state.should.be.false;
    should.not.exist(hoverCard.anchor);
    should.not.exist(hoverCard.type);
    should.not.exist(hoverCard.data);
  });

  it('triggers reactive effects', async () => {
    const hoverCard = createHoverCard();
    let count = 0;
    const increment = () => { count += 1; };
    for (const prop of ['anchor', 'type', 'data'])
      watch(() => hoverCard[prop], increment);
    hoverCard.show(document.body, 'foo', { bar: 'baz' });
    await nextTick();
    count.should.equal(3);
  });
});
