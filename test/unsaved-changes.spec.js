import sinon from 'sinon';

import createUnsavedChanges from '../src/unsaved-changes';

describe('createUnsavedChanges()', () => {
  describe('confirm()', () => {
    it('returns true if there are no unsaved changes', () => {
      createUnsavedChanges().confirm().should.be.true();
    });

    it('returns true if the user confirms', () => {
      const unsavedChanges = createUnsavedChanges();
      unsavedChanges.count = 1;
      sinon.replace(window, 'confirm', () => true);
      unsavedChanges.confirm().should.be.true();
    });

    it('returns false if the user does not confirm', () => {
      const unsavedChanges = createUnsavedChanges();
      unsavedChanges.count = 1;
      sinon.replace(window, 'confirm', () => false);
      unsavedChanges.confirm().should.be.false();
    });
  });
});
