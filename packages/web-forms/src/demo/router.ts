import type { Component } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import FormList from './FormList.vue';
import FormPreview from './FormPreview.vue';

const routes = [
	{ path: '/', component: FormList as Component },
	{ path: '/form/:category/:form', component: FormPreview as Component },
];

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

export default router;
