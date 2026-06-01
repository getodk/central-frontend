import type { Component } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import Preview from './components/preview.vue';
import Submission from './components/submission.vue';

const routes = [
	// TODO have some intermediary which loads the form to figure out whether to load WF or Enketo
	{ path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/submissions/new/:offline(offline)?', component: Preview as Component },
	{ path: '/projects/:projectId([1-9]\\d*)/forms/:xmlFormId/submissions/:instanceId/:actionType/', component: Submission as Component }
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
