import Base from '../../src/presenters/base';

class SimplePresenter extends Base([]) {}

describe('Base', () => {
  it('returns the correct i18n scope', () => {
    new SimplePresenter({}).i18nScope.should.equal('presenter.SimplePresenter');
  });
});
