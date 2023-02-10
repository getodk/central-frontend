import sinon from 'sinon';

import { memoizeForContainer } from '../../src/util/composable';

import createTestContainer from '../util/container';
import { withSetup } from '../util/lifecycle';

describe('util/composable', () => {
  describe('memoizeForContainer()', () => {
    it('calls the function with the container', () => {
      const composable = sinon.fake(() => ({}));
      const memoized = memoizeForContainer(composable);
      const container = createTestContainer();
      withSetup(memoized, { container });
      composable.calledWith(container).should.be.true();
    });

    it('returns the same result for the same container', () => {
      const memoized = memoizeForContainer(() => ({ x: 1 }));
      const container = createTestContainer();
      const result1 = withSetup(memoized, { container });
      const result2 = withSetup(memoized, { container });
      result1.should.eql({ x: 1 });
      result2.should.equal(result1);
    });

    it('returns a different result for a different container', () => {
      const memoized = memoizeForContainer(() => ({ x: 1 }));
      const result1 = withSetup(memoized, { container: createTestContainer() });
      const result2 = withSetup(memoized, { container: createTestContainer() });
      result1.should.eql({ x: 1 });
      result2.should.eql({ x: 1 });
      result2.should.not.equal(result1);
    });
  });
});
