import type { Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import FormPage from './FormPage.vue';

const routes = [
  { path: '/', component: FormPage as Component },
  { path: '/form/:formId', component: FormPage as Component },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
