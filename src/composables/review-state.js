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
import { always } from 'ramda';

const icons = new Map()
  .set(null, 'icon-dot-circle-o')
  .set('hasIssues', 'icon-comments')
  .set('edited', 'icon-pencil')
  .set('approved', 'icon-check-circle')
  .set('rejected', 'icon-times-circle');
const reviewStates = [...icons.keys()];
icons.set('received', icons.get(null));

export default always({
  reviewStates,
  reviewStateIcon: (reviewState) => icons.get(reviewState)
});
