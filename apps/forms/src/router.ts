import type { Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import Preview from './components/preview.vue';
import Submission from './components/submission.vue';
import { loadLocale, userLocale, i18n } from './i18n';

const routes = [
  {
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/preview',
    component: Preview as Component
  },
  {
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/draft/preview',
    component: Preview as Component,
    props: (route:any) => {
      return {
        ...route.params,
        draft: true
      };
    },
  },
  {
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/draft/submissions/:actionType(new)/:offline(offline)?',
    component: Submission as Component,
    props: (route:any) => {
      return {
        ...route.params,
        draft: true
      };
    },
  },
  {
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/submissions/:actionType(new)/:offline(offline)?',
    component: Submission as Component
  },
  {
    path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/submissions/:instanceId/:actionType/',
    component: Submission as Component
  },
  {
    path: '/f/:enketoId([a-zA-Z0-9]+)/:actionType(new|preview)?',
    component: Submission as Component
  },
  {
    path: '/f/:enketoId([a-zA-Z0-9]+)/:offline(offline)?',
    component: Submission as Component,
    props: (route:any) => {
      const { offline, ...params } = route.params;
      return {
        ...params,
        actionType: offline === 'offline' ? 'offline' : 'public-link',
      };
    },
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const locale = userLocale();
  if (locale) {
    loadLocale(i18n.global, locale);
  }
  next();
});

export default router;
