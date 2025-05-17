import createAlert from '../src/alert';
import { noop } from '../src/util/util';

describe('createAlert()', () => {
  for (const type of ['success', 'info', 'warning', 'danger']) {
    describe(`${type}()`, () => {
      it('updates the data', () => {
        const alert = createAlert();
        alert[type]('Something happened!');
        alert.type.should.equal(type);
        alert.message.should.equal('Something happened!');
        alert.state.should.be.true;
      });
    });
  }

  describe('cta()', () => {
    it('updates the data', () => {
      const alert = createAlert();
      should.not.exist(alert.ctaText);
      should.not.exist(alert.ctaHandler);

      alert.info('Something happened!');
      should.not.exist(alert.ctaText);
      should.not.exist(alert.ctaHandler);

      alert.cta('Click here', noop);
      alert.ctaText.should.equal('Click here');
      alert.ctaHandler.should.equal(noop);
    });
  });

  describe('blank()', () => {
    it('updates the data', () => {
      const alert = createAlert();
      alert.info('Something happened!').cta('Click here', noop);
      alert.blank();
      alert.state.should.be.false;
      should.not.exist(alert.message);
      should.not.exist(alert.ctaText);
      should.not.exist(alert.ctaHandler);
    });
  });
});
