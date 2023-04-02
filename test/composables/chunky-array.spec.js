import sinon from 'sinon';
import { isRef, nextTick, ref, watchEffect } from 'vue';

import useChunkyArray from '../../src/composables/chunky-array';

import { mount, withSetup } from '../util/lifecycle';

describe('useChunkyArray()', () => {
  it('returns a ref', () => {
    const chunky = withSetup(() => useChunkyArray(ref([])));
    isRef(chunky).should.be.true();
  });

  it('returns a ref whose value is null if value of source ref is nullish', () => {
    const chunky = withSetup(() => useChunkyArray(ref(null)));
    should(chunky.value).be.null();
  });

  describe('value of source ref is an array', () => {
    it('returns a ref whose value is an array', () => {
      const chunky = withSetup(() => useChunkyArray(ref([])));
      Array.isArray(chunky.value).should.be.true();
    });

    it('increases the length of the resulting array on an interval', () => {
      const clock = sinon.useFakeTimers();
      const chunky = withSetup(() =>
        useChunkyArray(ref(new Array(30).fill(0)), 2));
      chunky.value.length.should.equal(3);
      clock.tick(24);
      chunky.value.length.should.equal(3);
      clock.tick(1);
      chunky.value.length.should.equal(6);
      for (let i = 9; i <= 30; i += 3) {
        clock.tick(25);
        chunky.value.length.should.equal(i);
      }
      clock.tick(25);
      chunky.value.length.should.equal(30);
    });

    it('increases the length by at least the minimum', () => {
      const clock = sinon.useFakeTimers();
      const chunky = withSetup(() =>
        useChunkyArray(ref(new Array(30).fill(0)), 5));
      chunky.value.length.should.equal(5);
      clock.tick(25);
      chunky.value.length.should.equal(10);
    });

    it('does not increase length above length of source array', () => {
      const clock = sinon.useFakeTimers();
      const chunky = withSetup(() =>
        useChunkyArray(ref(new Array(5).fill(0)), 2));
      chunky.value.length.should.equal(2);
      clock.tick(25);
      chunky.value.length.should.equal(4);
      clock.tick(25);
      chunky.value.length.should.equal(5);
      clock.tick(25);
      chunky.value.length.should.equal(5);
    });

    it('does not increase the length if the source array is empty', () => {
      const clock = sinon.useFakeTimers();
      const chunky = withSetup(() => useChunkyArray(ref([])));
      chunky.value.length.should.equal(0);
      clock.tick(25);
      chunky.value.length.should.equal(0);
    });

    it('does not increase length if length of source array is less than minimum', () => {
      const clock = sinon.useFakeTimers();
      const chunky = withSetup(() => useChunkyArray(ref([0]), 2));
      chunky.value.length.should.equal(1);
      clock.tick(25);
      chunky.value.length.should.equal(1);
    });

    it('triggers a reactive effect when increasing the length', async () => {
      const clock = sinon.useFakeTimers();
      const chunky = withSetup(() =>
        useChunkyArray(ref(new Array(30).fill(0)), 2));
      let result = 0;
      watchEffect(() => { result = chunky.value.length; });
      result.should.equal(3);
      clock.tick(25);
      await nextTick();
      result.should.equal(6);
    });

    it('stops increasing the length after the component is unmounted', () => {
      const clock = sinon.useFakeTimers();
      let chunky;
      const component = mount({
        template: '<div></div>',
        setup: () => { chunky = useChunkyArray(ref(new Array(30).fill(0)), 2); }
      });
      chunky.value.length.should.equal(3);
      clock.tick(25);
      chunky.value.length.should.equal(6);
      component.unmount();
      chunky.value.length.should.equal(30);
      clock.tick(25);
      chunky.value.length.should.equal(30);
    });

    it('allows access to all elements of the source array', () => {
      const chunky = withSetup(() => useChunkyArray(ref([4, 5, 6, 7]), 2));
      chunky.value.length.should.equal(2);
      chunky.value[0].should.equal(4);
      chunky.value[1].should.equal(5);
      chunky.value[2].should.equal(6);
      chunky.value[3].should.equal(7);
      chunky.value.length.should.equal(2);
    });

    it('provides access to other properties of the source array', () => {
      const chunky = withSetup(() => useChunkyArray(ref([1, 1, 2, 3, 5]), 2));
      chunky.value.filter(n => n < 3).should.eql([1, 1]);
    });
  });

  describe('change to the value of the source ref', () => {
    it('starts increasing length after value changes to an array', async () => {
      const clock = sinon.useFakeTimers();
      const source = ref(null);
      const chunky = withSetup(() => useChunkyArray(source, 2));
      should(chunky.value).be.null();
      source.value = new Array(30).fill(0);
      await nextTick();
      Array.isArray(chunky.value).should.be.true();
      chunky.value.length.should.equal(3);
      clock.tick(25);
      chunky.value.length.should.equal(6);
    });

    it('changes value of resulting ref after value of source ref changes to null', async () => {
      const source = ref(new Array(30).fill(0));
      const chunky = withSetup(() => useChunkyArray(source, 2));
      chunky.value.length.should.equal(3);
      source.value = null;
      await nextTick();
      should(chunky.value).be.null();
    });

    it('resets length after value changes from array to null, then back to array', async () => {
      const clock = sinon.useFakeTimers();
      const array = new Array(30).fill(0);
      const source = ref(array);
      const chunky = withSetup(() => useChunkyArray(source, 2));
      chunky.value.length.should.equal(3);
      clock.tick(25);
      chunky.value.length.should.equal(6);
      source.value = null;
      await nextTick();
      source.value = array;
      await nextTick();
      chunky.value.length.should.equal(3);
      clock.tick(25);
      chunky.value.length.should.equal(6);
    });

    it('resets length after value changes from one array to another', async () => {
      const clock = sinon.useFakeTimers();
      const source = ref(new Array(30).fill(0));
      const chunky = withSetup(() => useChunkyArray(source, 2));
      chunky.value.length.should.equal(3);
      clock.tick(25);
      chunky.value.length.should.equal(6);
      source.value = new Array(40).fill(0);
      await nextTick();
      chunky.value.length.should.equal(4);
      clock.tick(25);
      chunky.value.length.should.equal(8);
    });

    it('stops increasing length if length of source array changes to current length', async () => {
      const clock = sinon.useFakeTimers();
      const source = ref(new Array(30).fill(0));
      const chunky = withSetup(() => useChunkyArray(source, 2));
      chunky.value.length.should.equal(3);
      source.value.splice(3);
      await nextTick();
      chunky.value.length.should.equal(3);
      clock.tick(25);
      chunky.value.length.should.equal(3);
    });

    it('changes length if length of source array changes to below current length', async () => {
      const clock = sinon.useFakeTimers();
      const source = ref(new Array(30).fill(0));
      const chunky = withSetup(() => useChunkyArray(source, 2));
      chunky.value.length.should.equal(3);
      source.value.splice(2);
      await nextTick();
      chunky.value.length.should.equal(2);
      clock.tick(25);
      chunky.value.length.should.equal(2);
    });

    it('adjusts increase if length of source array changes but stays above current length', async () => {
      const clock = sinon.useFakeTimers();
      const source = ref(new Array(30).fill(0));
      const chunky = withSetup(() => useChunkyArray(source, 2));
      chunky.value.length.should.equal(3);
      for (let i = 6; i <= 24; i += 3) clock.tick(25);
      chunky.value.length.should.equal(24);
      // After this, source.value.length === 64. 64 / 10 = 6.4, but the increase
      // should be 4 because (64 - 24) / 10 = 4.
      for (let i = 0; i < 34; i += 1) source.value.push(0);
      await nextTick();
      chunky.value.length.should.equal(28);
      clock.tick(25);
      chunky.value.length.should.equal(32);
      for (let i = 36; i <= 64; i += 4) {
        clock.tick(25);
        chunky.value.length.should.equal(i);
      }
      clock.tick(25);
      chunky.value.length.should.equal(64);
    });

    it('starts increasing again if length of source array increases even if it was done', async () => {
      const clock = sinon.useFakeTimers();
      const source = ref(new Array(30).fill(0));
      const chunky = withSetup(() => useChunkyArray(source, 2));
      chunky.value.length.should.equal(3);
      for (let i = 6; i <= 30; i += 3) clock.tick(25);
      chunky.value.length.should.equal(30);
      for (let i = 0; i < 34; i += 1) source.value.push(0);
      await nextTick();
      chunky.value.length.should.equal(34);
      clock.tick(25);
      chunky.value.length.should.equal(38);
    });
  });
});
