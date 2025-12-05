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

export const enketoBasePath = '/-';

export const noop = () => {};
export const noargs = (f) => () => f();

export const sumUnderThreshold = (list, threshold) => list.reduce((acc, i) => acc + Math.min(i, threshold), 0);

// Converts a string from kebab-case to camelCase.
export const kebabToCamel = (s) =>
  s.replace(/-([a-z])/g, (match) => match[1].toUpperCase());

export const getCookieValue = (key, doc = document) => decodeURIComponent(doc.cookie.split(';')
  .map(cookie => cookie.trim())
  .find(cookie => cookie.startsWith(`${key}=`))
  ?.split('=')[1] || '');

// Returns an object of event handlers that simply re-emit the specified events.
// Useful for nested components. Pass the resulting object to v-on.
export const reemit = (emit, events) => Object.fromEntries(events.map(name =>
  [kebabToCamel(name), (...args) => emit(name, ...args)]));
