import sinon from 'sinon';

import createTestContainer from './util/container';

describe('createUnsavedChanges()', () => {
  describe('confirm()', () => {
    it('returns true if there are no unsaved changes', () => {
      const { unsavedChanges } = createTestContainer();
      unsavedChanges.confirm().should.be.true();
    });

    it('prompts the user if there are unsaved changes', () => {
      const { unsavedChanges } = createTestContainer();
      unsavedChanges.plus(1);
      const fake = sinon.fake.returns(true);
      sinon.replace(window, 'confirm', fake);
      unsavedChanges.confirm();
      fake.called.should.be.true();
      fake.args[0][0].should.startWith('Are you sure you want to leave this page?');
    });

    it('returns true if the user confirms', () => {
      const { unsavedChanges } = createTestContainer();
      unsavedChanges.plus(1);
      sinon.replace(window, 'confirm', () => true);
      unsavedChanges.confirm().should.be.true();
    });

    it('returns false if the user does not confirm', () => {
      const { unsavedChanges } = createTestContainer();
      unsavedChanges.plus(1);
      sinon.replace(window, 'confirm', () => false);
      unsavedChanges.confirm().should.be.false();
    });
  });
});
