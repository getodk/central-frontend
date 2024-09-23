import type { Component } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import FormPreview from './FormPreview.vue';
import HomePage from './HomePage.vue';

const routes = [
	{ path: '/', component: HomePage as Component },
	{ path: '/form', component: FormPreview as Component },
	{ path: '/form/:category/:form', component: FormPreview as Component },
];

const router = createRouter({
	history: createWebHashHistory(),
	routes,
});

export default router;
