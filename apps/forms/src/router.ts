import type { Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import Preview from './components/preview.vue';

const routes = [
	{ path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/submissions/new/:offline(offline)?', component: Preview as Component } // TODO have some intermediary which loads the form to figure out whether to load WF or Enketo
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
