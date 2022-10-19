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
import { watch, watchEffect } from 'vue';

export const watchSync = (source, callback, options = undefined) =>
  watch(source, callback, { ...options, flush: 'sync' });

export const setDocumentTitle = (title) => watchEffect(() => {
  // Append ODK Central to every title, filter out any null values (e.g. project
  // name before the project object was loaded), join with separator.
  document.title = title().concat('ODK Central').filter(x => x).join(' | ');
});
