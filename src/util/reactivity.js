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
import { shallowReactive, watch, watchEffect } from 'vue';

import { loadedAsync } from './load-async';

export const watchSync = (source, callback, options = undefined) =>
  watch(source, callback, { ...options, flush: 'sync' });

export const setDocumentTitle = (title) => watchEffect(() => {
  // Append ODK Central to every title, filter out any null values (e.g. project
  // name before the project object was loaded), join with separator.
  document.title = title().concat('ODK Central').filter(x => x).join(' | ');
});



////////////////////////////////////////////////////////////////////////////////
// modalData()

const _asyncComponent = Symbol('asyncComponent');
class ModalData {
  constructor(asyncComponent = undefined) {
    this.state = false;
    // Using a Symbol so that the property is not enumerable. We don't want
    // v-bind to pass this property to the modal component as a prop.
    this[_asyncComponent] = asyncComponent;
  }

  // Shows the modal by setting the `state` prop to `true`. Optionally sets
  // other props.
  show(data = undefined) {
    if (this[_asyncComponent] != null && !loadedAsync(this[_asyncComponent]))
      return;
    Object.assign(this, data);
    this.state = true;
  }

  // Hides the modal by setting the `state` prop to `false`. Also removes other
  // props unless specified otherwise.
  hide(clear = true) {
    if (clear) {
      for (const name of Object.keys(this)) delete this[name];
    }
    this.state = false;
  }
}

// modalData() returns an object that holds props to pass to a modal component.
// The object can be passed to the modal component using v-bind. If the modal
// component is loaded async, specify the component's name.
export const modalData = (asyncComponent = undefined) =>
  shallowReactive(new ModalData(asyncComponent));
