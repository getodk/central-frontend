/*
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

/*
This mixin includes methods related to submission review state.

The mixin factory does not take any options.
*/

const icons = {
  hasIssues: 'icon-comments',
  edited: 'icon-pencil',
  approved: 'icon-check-circle',
  rejected: 'icon-times-circle'
};

// @vue/component
const mixin = {
  methods: {
    reviewStateIcon(reviewState) {
      return reviewState == null ? 'icon-dot-circle-o' : icons[reviewState];
    }
  }
};

export default () => mixin;
