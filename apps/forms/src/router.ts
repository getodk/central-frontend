import type { Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import Preview from './components/preview.vue';
import Submission from './components/submission.vue';
import { loadUsersLocale } from './i18n';

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const routes = [
  {
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/preview',
    component: Preview as Component
  },
  {
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/draft/preview',
    component: Preview as Component,
    props: () => {
      return {
        draft: true
      };
    },
  },
  {
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/draft/submissions/new/:offline(offline)?',
    component: Submission as Component,
    name: 'DraftSubmissionNew',
    props: (route) => {
      const { offline } = route.params;
      return {
        draft: true,
        actionType: offline === 'offline' ? 'offline' : 'new',
      };
    },
  },
  {
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/submissions/new/:offline(offline)?',
    component: Submission as Component,
    name: 'SubmissionNew',
    props: (route) => {
      const { offline } = route.params;
      return {
        draft: false,
        actionType: offline === 'offline' ? 'offline' : 'new',
      };
    },
  },
  {
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/submissions/:instanceId/:actionType(edit)',
    component: Submission as Component,
    name: 'SubmissionEdit',
    props: () => {
      return {
        actionType: 'edit'
      };
    },
  },
  {
    path: '/f/:enketoId([a-zA-Z0-9]+)/:actionType(new|preview)',
    component: Submission as Component,
    props: (route) => {
      return {
        actionType: route.params.actionType
      };
    },
  },
  {
    path: '/f/:enketoId([a-zA-Z0-9]+)/:offline(offline)?',
    component: Submission as Component,
    props: (route) => {
      const { offline } = route.params;
      return {
        draft: false,
        actionType: offline === 'offline' ? 'offline' : 'public-link',
      };
    },
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((_to, _from, next) => {
  loadUsersLocale();
  next();
});

export default router;
