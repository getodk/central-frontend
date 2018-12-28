/*
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
This mixin can be used by a component with one or more modals. The mixin
contains methods for toggling a modal, and it ensures that the component's
modals are hidden when a navigation is triggered.

The component using the mixin must define a data property for each modal, then
specify the names of those properties to the mixin. Each modal's corresponding
property must be an object. The mixin requires the object to have a `state`
property that indicates whether the modal should be shown.

Note that while the mixin manages data properties of a component that contains
modals, it does not implement the modals themselves: the Modal component is
responsible for implementing the actual modals.

Because it contains navigation guards, the mixin can be used only by components
specified to the router.
*/
export default (nameOrNames) => {
  const names = typeof nameOrNames === 'string' ? [nameOrNames] : nameOrNames;
  const hideModals = function hideModals(to, from, next) {
    let anyShown = false;
    for (const name of names) {
      if (this[name].state) {
        anyShown = true;
        this[name].state = false;
      }
    }

    if (anyShown) {
      // Wait a tick for Modal to react to the changes to `state`.
      this.$nextTick(next);
    } else {
      next();
    }
  };
  // @vue/component
  return {
    beforeRouteUpdate: hideModals,
    beforeRouteLeave: hideModals,
    methods: {
      showModal(name) {
        this[name].state = true;
      },
      hideModal(name) {
        this[name].state = false;
      }
    }
  };
};
