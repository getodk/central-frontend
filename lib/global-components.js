/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Vue from 'vue';

import Alert from './components/alert.vue';
import Breadcrumbs from './components/breadcrumbs.vue';
import ListHeading from './components/list-heading.vue';
import Loading from './components/loading.vue';

// Array of components to register globally:
// https://vuejs.org/v2/guide/components.html#Global-Registration
// A global component must have a `name` property whose value is PascalCase:
// https://vuejs.org/v2/guide/components.html#Component-Naming-Conventions
const globalComponents = [
  Alert,
  Breadcrumbs,
  ListHeading,
  Loading
];

const register = () => {
  for (const component of globalComponents)
    Vue.component(component.name, component);
};

export default { register };
