/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
A component that contains one or more modals may use this mixin, which includes
methods for toggling a modal.

The component using this mixin must define a data property for each modal that
it contains. The property should be an object that has a property named `state`
that indicates whether the modal should be shown.

If a component loads a modal component asynchronously, then when the component
uses the mixin, it should specify the name of the modal component along with the
name of the associated property. For example:

  modal({ submissionOptions: 'ProjectSubmissionOptions' })
*/

import { loadedAsync } from '../util/load-async';

// @vue/component
const mixin = {
  methods: {
    showModal(name) {
      this[name].state = true;
    },
    hideModal(name) {
      this[name].state = false;
    }
  }
};

const mixinForAsyncModals = (asyncModals) => ({
  methods: {
    showModal(name) {
      const componentName = asyncModals[name];
      if (componentName == null || loadedAsync(componentName))
        this[name].state = true;
    },
    hideModal: mixin.methods.hideModal
  }
});

export default (asyncModals = undefined) =>
  (asyncModals == null ? mixin : mixinForAsyncModals(asyncModals));
