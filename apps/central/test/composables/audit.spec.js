import useAudit from '../../src/composables/audit';

import { withSetup } from '../util/lifecycle';

describe('useAudit()', () => {
  describe('categoryMessage()', () => {
    it('returns the message for a category', () => {
      const { categoryMessage } = withSetup(useAudit);
      categoryMessage('user').should.equal('Web User Actions');
    });

    it('returns null for an unknown category', () => {
      const { categoryMessage } = withSetup(useAudit);
      should.not.exist(categoryMessage('unknown'));
    });
  });

  describe('actionMessage()', () => {
    it('returns the message for an action', () => {
      const { actionMessage } = withSetup(useAudit);
      actionMessage('user.delete').should.equal('Retire');
    });

    it('returns the message for an action with multiple levels', () => {
      const { actionMessage } = withSetup(useAudit);
      actionMessage('user.assignment.create').should.equal('Assign Role');
    });

    it('returns null for an unknown action', () => {
      const { actionMessage } = withSetup(useAudit);
      should.not.exist(actionMessage('unknown'));
    });
  });
});
