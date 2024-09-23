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

// useAudit() returns functions related to audit log entries.

import { memoizeForContainer } from '../util/composable';

// Returns the i18n path to use to describe the specified audit log action.
const actionPath = (action) => {
  const index = action.indexOf('.');
  if (index === -1) return `audit.action.${action}`;
  const category = action.slice(0, index);
  const subaction = action.slice(index + 1);
  const subactionKey = subaction.replace(/[.-]/g, '_');
  return `audit.action.${category}.${subactionKey}`;
};

export default memoizeForContainer(({ i18n }) => ({
  // The "category" is the resource or broader type associated with an audit log
  // action. It is identified by the first part/segment of the action (before
  // the first period) when the action has multiple parts. categoryMessage()
  // returns a message describing a category.
  categoryMessage: (category) => {
    const path = `audit.category.${category}`;
    return i18n.te(path, i18n.fallbackLocale) ? i18n.t(path) : null;
  },
  // Returns a message describing an audit log action.
  actionMessage: (action) => {
    const path = actionPath(action);
    return i18n.te(path, i18n.fallbackLocale) ? i18n.t(path) : null;
  }
}));
