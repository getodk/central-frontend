/*
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/

import PreferenceNormalizer from './normalizer';

// The SitePreferenceNormalizer and ProjectPreferenceNormalizer classes are used to:
//  a)  verify that the preference key has been declared here.
//      Such might seem persnickety, but it allows us to have a central
//      registry of which keys are in use.
//  b)  normalize the value as per the normalization function with the name
//      of the preference. This also allows supplying a default.
//      Preferences serverside may have been created by some frontend version that
//      used different semantics (different values, perhaps differently typed).
//      Writing a validator function here makes it so one does not have to be defensive
//      for that eventuality in *every single usage site of the setting*.
//
// As such, any newly introduced preference will need a normalization function added
// to one of those classes, even if it's just a straight passthrough.
// Furthermore, the answer to "why can't I set an arbitrary value for a certain preference"
// can be found there.


export class SitePreferenceNormalizer extends PreferenceNormalizer {
  static projectSortMode(val) {
    return ['alphabetical', 'latest', 'newest'].includes(val) ? val : 'latest';
  }

  static outdatedVersionWarningDismissDate(val) {
    // Frontend to Backend
    if (val instanceof Date) {
      return val.toISOString();
    }

    // Backend to Frontend
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z?$/;
    if (typeof (val) === 'string' && isoDateRegex.test(val)) {
      return val;
    }

    return null;
  }

  // Checks year + major release
  // Validates that input is type string, has exactly 4 digits, then a `.`, then one or more digits, and then the end of the string.
  // '2025.4' becomes '2025.4'
  // but true / 'hello' / '25.4' / 3000 all become null.
  static whatsNewDismissed(val) {
    return typeof val === 'string' && /^\d{4}\.\d+$/.test(val) ? val : null;
  }

  // Return true, false, or null/undefined based on the value
  // true if explicitly true, false if explicitly false, null/undefined otherwise
  static mailingListOptIn(val) {
    if (val === true || val === false) return val;
    return null;
  }
}

export class ProjectPreferenceNormalizer extends PreferenceNormalizer {
  static formTrashCollapsed(val) {
    return val === true;
  }

  static datasetTrashCollapsed(val) {
    return val === true;
  }
}
