import type { Component } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import FormPage from './form.vue';

const routes = [
  { path: '/form/:formId', component: FormPage as Component },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
