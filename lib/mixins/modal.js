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
A component that contains one or more mixins may use this mixin, which includes
methods for toggling a modal.

The component using this mixin must define a data property for each modal. Each
modal's corresponding property must be an object. The mixin requires that the
object have a `state` property that indicates whether the modal should be shown.
*/
export default () => { // eslint-disable-line arrow-body-style
  // @vue/component
  return {
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
