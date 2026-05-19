import { nextTick, watch } from 'vue';

import { loadAsync, setLoader } from '../../src/util/load-async';
import { modalData } from '../../src/util/reactivity';

describe('util/reactivity', () => {
  describe('modalData()', () => {
    it('initializes the state prop as false', () => {
      modalData().state.should.be.false;
    });

    describe('show()', () => {
      it('sets the state prop to true', () => {
        const modal = modalData();
        modal.show();
        modal.state.should.be.true;
      });

      it('sets other props', () => {
        const modal = modalData();
        modal.show({ foo: 'bar' });
        modal.foo.should.equal('bar');
      });

      it('triggers reactive effects', async () => {
        const modal = modalData();
        let count = 0;
        watch(() => modal.state, () => { count += 1; });
        watch(() => modal.foo, () => { count += 1; });
        modal.show({ foo: 'bar' });
        await nextTick();
        count.should.equal(2);
      });

      describe('async component', () => {
        beforeAll(() => {
          setLoader('MyModal', async () => ({
            default: { foo: 'bar' }
          }));
        });

        it('does not set state prop to true if component has not loaded', () => {
          const modal = modalData('MyModal');
          modal.show();
          modal.state.should.be.false;
        });

        it('sets state prop to true if component has loaded', async () => {
          const modal = modalData('MyModal');
          await loadAsync('MyModal')();
          modal.show();
          modal.state.should.be.true;
        });
      });
    });

    describe('hide()', () => {
      it('sets the state prop to false', () => {
        const modal = modalData();
        modal.show();
        modal.hide();
        modal.state.should.be.false;
      });

      it('clears other props', () => {
        const modal = modalData();
        modal.show({ foo: 'bar' });
        modal.hide();
        modal.should.not.have.property('foo');
      });

      it('does not clear other props if specified', () => {
        const modal = modalData();
        modal.show({ foo: 'bar' });
        modal.hide(false);
        modal.state.should.be.false;
        modal.foo.should.equal('bar');
      });

      it('triggers reactive effects', async () => {
        const modal = modalData();
        modal.show({ foo: 'bar' });
        let count = 0;
        watch(() => modal.state, () => { count += 1; });
        watch(() => modal.foo, () => { count += 1; });
        modal.hide();
        await nextTick();
        count.should.equal(2);
      });
    });

    it('only enumerates over props', () => {
      const modal = modalData();
      modal.show({ foo: 'bar' });
      Object.keys(modal).should.eql(['state', 'foo']);
    });
  });
});
