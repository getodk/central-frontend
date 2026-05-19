/*
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { computed, onUnmounted, ref, watch } from 'vue';

/*
useChunkyArray() creates a proxy of an array such that the length of the proxy
is less than the actual length of the array. The length of the proxy will
increase in steps over the course of a second or so, until it equals the length
of the array. The length of the proxy is reactive. useChunkyArray() is helpful
if an array may be large and is used in a potentially expensive v-for, because
it reduces the amount of time during which Frontend is busy rendering and is
nonresponsive. (There will be more renders, but each render will be shorter.)

useChunkyArray() takes a ref whose value is either an array or nullish,
returning a computed ref. If the value of the ref is an array, then the value of
the computed ref will be a proxy as described above. If the value of the ref is
nullish, then the value of the computed ref will be `null`.
*/
export default (arrayRef, minChunkSize = 25) => {
  // The length of the proxy
  const length = ref(0);
  let chunkSize;
  let intervalId;
  const stopChunks = () => {
    if (chunkSize == null) return;
    chunkSize = null;
    clearInterval(intervalId);
    intervalId = null;
  };
  const addChunk = () => {
    length.value += chunkSize;
    if (length.value >= arrayRef.value.length) {
      length.value = arrayRef.value.length;
      stopChunks();
    }
  };
  const proxyLength = () => {
    // If length.value has already been increased to arrayRef.value.length (or
    // if arrayRef.value.length is 0), return arrayRef.value.length.
    if (length.value === arrayRef.value.length) return arrayRef.value.length;

    // If chunkSize is set, then an addChunk() interval is in progress and is
    // working on increasing length.value. In the meantime, we return the
    // current length.value so that proxyLength() is consistent between
    // addChunk() calls.
    if (chunkSize != null) return length.value;

    // If length.value almost equals arrayRef.value.length, don't bother setting
    // up an addChunk() interval.
    if (arrayRef.value.length - length.value <= minChunkSize) {
      length.value = arrayRef.value.length;
      return arrayRef.value.length;
    }

    // Set chunkSize and start increasing length.value.
    chunkSize = Math.max(
      Math.ceil((arrayRef.value.length - length.value) / 10),
      minChunkSize
    );
    length.value += chunkSize;
    intervalId = setInterval(addChunk, 25);
    return length.value;
  };
  const proxyHandler = {
    // Note that the proxy allows access to all elements of the array: it only
    // returns a different value for the length. Restricting access to elements
    // would have a performance cost, because it would cause the `length` ref to
    // become a dependency of more reactive effects. It doesn't seem necessary
    // to restrict access to elements.
    get: (array, prop) => (prop === 'length' ? proxyLength() : array[prop])
  };
  const result = computed(() => (arrayRef.value != null
    ? new Proxy(arrayRef.value, proxyHandler)
    : null));

  watch(
    [arrayRef, () => arrayRef.value?.length],
    ([newArray, newLength], [oldArray]) => {
      if (newArray !== oldArray)
        length.value = 0;
      else if (newLength < length.value)
        length.value = newLength;

      // We call stopChunks() even if newLength > length.value so that
      // proxyLength() can calculate a new chunkSize. Since
      // arrayRef.value.length has changed, a reactive effect that has
      // (indirectly) called proxyLength() (for example, v-for) will end up
      // calling proxyLength() again.
      stopChunks();
    }
  );
  onUnmounted(() => {
    stopChunks();
    // For testing. If proxyLength() is called after the component is unmounted,
    // as it is in testing, we don't want it to start a new addChunk() interval.
    if (arrayRef.value != null) length.value = arrayRef.value.length;
  });
  /* Another case that would be nice to watch is if the value of an element
  changes (for example, after the array is sorted). In that case, if
  length.value !== arrayRef.value.length already, then length.value should
  perhaps be reset to 0. However, it's not easy to watch for that case in a
  performant way. A deep watcher would work, but it could be expensive. (After
  all, the whole point of useChunkyArray() is to aid performance!) It would be
  unfortunate if the array were sorted while length.value was increasing,
  because a v-for might not preserve all components already rendered. However,
  that also seems unlikely given how quickly length.value increases. */

  return result;
};
