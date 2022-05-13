/*
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
Some components need to continuously check for a condition until the condition
is true. This mixin includes the method callWait() to help do so.

Specify a function to callWait() that checks the condition, returning `true` or
`false`, then specify a second function that returns the number of milliseconds
to wait before each check. A component may check for multiple conditions, so you
must also specify a name for the check. For example:

  // Continuously check whether it is the afternoon.
  this.callWait(
    'afternoon',
    () => {
      if (DateTime.local().hour < 11) return false;
      this.alert.info('It is the afternoon!');
      return true;
    },
    // Wait a second before each of the first 100 tries, then wait a minute
    // before each try that follows.
    wait: (tries) => tries < 100 ? 1000 : 60000
  );

The first function may return a promise. The promise should resolve to `true` or
`false`. If the promise is rejected, the component will stop checking the
condition.

To cancel an upcoming check, use cancelCall() or cancelCalls(). If an upcoming
check should be canceled after a route update, it is the component's
responsibility to do so.

The mixin factory does not take any options.

The component using this mixin must define the following data property:

  - calls. Stores information about the calls. Initialize the property as an
    empty object. The component using the mixin should not directly mutate this
    property after defining it.
*/

// @vue/component
const mixin = {
  beforeDestroy() {
    this.cancelCalls();
  },
  methods: {
    callWait(name, call, wait) {
      if (this.calls[name] != null) throw new Error('name is in use');

      /* The component might invoke this.cancelCall() during the initial wait
      before call() is first run. If call() completes an asynchronus action, the
      component might also invoke this.cancelCall() while the asynchronous
      action is in progress. Further, after invoking this.cancelCall(), the
      component may invoke this.callWait() and use the same name as before. That
      means that there may be multiple actions in progress that are associated
      with the same name. However, cancel(), defined below, will be unique to
      each invocation of this.callWait(). */
      let timeoutId;
      let canceled = false;
      const cancel = () => {
        if (timeoutId != null) clearTimeout(timeoutId);
        canceled = true;
      };
      this.calls[name] = cancel;

      let count = 0;
      const f = () => {
        if (canceled) return;
        timeoutId = null;
        Promise.resolve(call())
          .then(success => {
            if (canceled) return;
            if (success) {
              delete this.calls[name];
            } else {
              count += 1;
              const delay = wait(count);
              if (delay == null)
                delete this.calls[name];
              else
                timeoutId = setTimeout(f, delay);
            }
          })
          .catch(() => {
            if (!canceled) delete this.calls[name];
          });
      };
      timeoutId = setTimeout(f, wait(0));
    },
    cancelCalls() {
      for (const cancel of Object.values(this.calls))
        cancel();
      this.calls = {};
    },
    cancelCall(name) {
      const cancel = this.calls[name];
      if (cancel != null) {
        cancel();
        delete this.calls[name];
      }
    }
  }
};

export default () => mixin;
