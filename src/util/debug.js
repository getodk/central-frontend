/*
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import { nextTick, onBeforeMount, onBeforeUpdate, onMounted, onUpdated } from 'vue';
import { sum } from 'ramda';

// eslint-disable-next-line no-console
const logTick = () => { console.log('tick'); };
export const ticking = (count, callback = logTick) => {
  let i = 0;
  const ticker = () => {
    callback(i);
    i += 1;
    if (i < count) nextTick(ticker);
  };
  nextTick(ticker);
};

class RenderTimer {
  constructor() {
    this.state = false;
    this._once = false;
    this.durations = [];
  }

  // Starts timing renders.
  on() {
    this.state = true;
    this._once = false;
  }

  // Stops timing renders.
  off() {
    this.state = false;
    this._once = false;
  }

  // Times the next render, then stops timing.
  once() {
    this.state = true;
    this._once = true;
  }

  // Adds a duration from the composable.
  _push(duration) {
    if (this.state) {
      this.durations.push(duration);
      if (this._once) this.off();
    }
  }

  // Returns summary statistics about the durations timed so far.
  summarize() {
    if (this.durations.length === 0) return {};
    const stats = {
      count: this.durations.length,
      min: Math.min(...this.durations),
      max: Math.max(...this.durations),
      sum: sum(this.durations)
    };
    stats.avg = stats.sum / stats.count;
    return stats;
  }
}

// useRenderTimer() is a composable. It returns a timer object that can help
// measure performance around rendering.
export const useRenderTimer = () => {
  const timer = new RenderTimer();

  let timeBefore;
  const setTime = () => { timeBefore = Date.now(); };
  onBeforeMount(setTime);
  onBeforeUpdate(setTime);

  const hooks = [['mounted', onMounted], ['updated', onUpdated]];
  for (const [name, f] of hooks) {
    f(() => { // eslint-disable-line no-loop-func
      const duration = Date.now() - timeBefore;
      timer._push(duration);

      const onOrOff = timer.state ? 'on' : 'off';
      // eslint-disable-next-line no-console
      console.log(`[useRenderTimer] ${name} (timer ${onOrOff})`, duration);
    });
  }

  return timer;
};
