import createAlert from '../src/alert';

describe('createAlert()', () => {
  for (const type of ['success', 'info', 'warning', 'danger']) {
    describe(`${type}()`, () => {
      it('updates the data', () => {
        const alert = createAlert();
        alert[type]('Something happened!');
        alert.type.should.equal(type);
        alert.message.should.equal('Something happened!');
        alert.state.should.be.true();
      });
    });
  }

  describe('blank()', () => {
    it('updates the data', () => {
      const alert = createAlert();
      alert.info('Something happened!');
      alert.blank();
      alert.state.should.be.false();
      should.not.exist(alert.message);
    });
  });
});
