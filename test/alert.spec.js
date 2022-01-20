import createAlert from '../src/alert';

describe('createAlert()', () => {
  for (const type of ['success', 'info', 'warning', 'danger']) {
    describe(`${type}()`, () => {
      it('updates alert.data', () => {
        const alert = createAlert();
        alert[type]('Something happened!');
        const { data } = alert;
        data.state.should.be.true();
        data.type.should.equal(type);
        data.message.should.equal('Something happened!');
      });
    });
  }

  describe('blank()', () => {
    it('resets properties of alert.data', () => {
      const alert = createAlert();
      alert.info('Something happened!');
      alert.blank();
      alert.data.state.should.be.false();
      should.not.exist(alert.data.message);
    });
  });
});
