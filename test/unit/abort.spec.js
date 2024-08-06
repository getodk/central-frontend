import sinon from 'sinon';

import { rejectOnAbort } from '../../src/util/abort';

describe('util/abort', () => {
  describe('rejectOnAbort()', () => {
    it('rejects if the signal is already aborted', () => {
      const controller = new AbortController();
      controller.abort();
      const reject = sinon.fake();
      rejectOnAbort(controller.signal, reject);
      reject.callCount.should.equal(1);
      reject.firstArg.should.be.an.instanceof(Error);
    });

    it('rejects if the signal becomes aborted', () => {
      const controller = new AbortController();
      const reject = sinon.fake();
      rejectOnAbort(controller.signal, reject);
      reject.callCount.should.equal(0);
      controller.abort();
      reject.callCount.should.equal(1);
      reject.firstArg.should.be.an.instanceof(Error);
    });

    it('returns a function to remove the event listener', () => {
      const controller = new AbortController();
      const reject = sinon.fake();
      const removeListener = rejectOnAbort(controller.signal, reject);
      removeListener();
      controller.abort();
      reject.callCount.should.equal(0);
    });
  });
});
