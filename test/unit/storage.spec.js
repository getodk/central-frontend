import sinon from 'sinon';

import { localStore } from '../../src/util/storage';

describe('unit/storage', () => {
  describe('localStore', () => {
    describe('getItem()', () => {
      it('returns an item', () => {
        localStorage.setItem('foo', 'bar');
        localStore.getItem('foo').should.equal('bar');
      });

      it('returns null if local storage throws an error', () => {
        localStorage.setItem('foo', 'bar');
        sinon.replaceGetter(window, 'localStorage', sinon.fake.throws('error'));
        should.not.exist(localStore.getItem('foo'));
      });
    });

    describe('setItem()', () => {
      it('sets an item', () => {
        localStore.setItem('foo', 'bar');
        localStorage.getItem('foo').should.equal('bar');
      });

      it('does nothing if local storage throws an error', () => {
        const storage = localStorage;
        sinon.replaceGetter(window, 'localStorage', sinon.fake.throws('error'));
        localStore.setItem('foo', 'bar');
        should.not.exist(storage.getItem('foo'));
      });
    });

    describe('removeItem()', () => {
      it('removes an item', () => {
        localStorage.setItem('foo', 'bar');
        localStore.removeItem('foo');
        should.not.exist(localStorage.getItem('foo'));
      });

      it('does nothing if local storage throws an error', () => {
        localStorage.setItem('foo', 'bar');
        const storage = localStorage;
        sinon.replaceGetter(window, 'localStorage', sinon.fake.throws('error'));
        localStore.removeItem('foo');
        storage.getItem('foo').should.equal('bar');
      });
    });
  });
});
