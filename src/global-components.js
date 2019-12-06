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
import Vue from 'vue';

import FloatRow from './components/float-row.vue';
import Loading from './components/loading.vue';
import Modal from './components/modal.vue';
import PageBody from './components/page/body.vue';
import PageHead from './components/page/head.vue';
import PageSection from './components/page/section.vue';
import RefreshButton from './components/refresh-button.vue';
import Spinner from './components/spinner.vue';

// Array of components to register globally:
// https://vuejs.org/v2/guide/components.html#Global-Registration
// A global component must have a `name` property whose value is PascalCase:
// https://vuejs.org/v2/guide/components.html#Component-Naming-Conventions
const globalComponents = [
  FloatRow,
  Loading,
  Modal,
  PageBody,
  PageHead,
  PageSection,
  RefreshButton,
  Spinner
];

const register = () => {
  for (const component of globalComponents)
    Vue.component(component.name, component);
};

export default { register };
