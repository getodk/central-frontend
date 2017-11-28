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
import VueRouter from 'vue-router';

import FormList from './components/form/list.vue';
import FormNew from './components/form/new.vue';
import FormEdit from './components/form/edit.vue';

import SubmissionList from './components/submission/list.vue';

import NotFound from './components/not-found.vue';

Vue.use(VueRouter);

const routes = [
  { path: '/', redirect: '/forms' },

  { path: '/forms', component: FormList },
  { path: '/forms/new', component: FormNew },
  { path: '/forms/:xmlFormId/edit', component: FormEdit },

  { path: '/forms/:xmlFormId/submissions', component: SubmissionList },

  { path: '*', component: NotFound }
];

export default new VueRouter({ routes });
