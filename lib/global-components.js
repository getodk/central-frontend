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

import Alerts from './components/alerts.vue';
import AppForm from './components/app-form.vue';
import Loading from './components/loading.vue';
import Modal from './components/modal.vue';
import PageHead from './components/page-head.vue';
import PageBody from './components/page-body.vue';

// Array of components to register globally:
// https://vuejs.org/v2/guide/components.html#Global-Registration
// A global component must have a `name` property whose value is PascalCase:
// https://vuejs.org/v2/guide/components.html#Component-Naming-Conventions
const globalComponents = [
  Alerts,
  AppForm,
  Loading,
  Modal,
  PageHead,
  PageBody
];

const register = () => {
  for (const component of globalComponents)
    Vue.component(component.name, component);
};

export default { register };
