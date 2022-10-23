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
import { shallowReactive, watchSyncEffect } from 'vue';

import { useRequestData } from './index';

export default () => {
  const { currentUser, createResource } = useRequestData();
  const user = createResource('user', () => ({
    // If the data becomes more deeply reactive, we will have to update the
    // watchSyncEffect() below.
    transformResponse: ({ data }) => shallowReactive(data)
  }));
  watchSyncEffect(() => {
    // currentUser won't have data immediately after logout.
    if (user.dataExists && currentUser.dataExists && user.id === currentUser.id)
      currentUser.patch(user.data);
  });
  return user;
};
