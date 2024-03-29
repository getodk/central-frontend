import type { Component } from 'vue';
import { createApp } from 'vue';

import PrimeVue from 'primevue/config';
import App from './App.vue';

import './assets/css/icomoon.css';
import './themes/2024-light/theme.scss';
// TODO/sk: Purge it - postcss-purgecss
import 'primeflex/primeflex.css';

import './assets/css/style.scss';

const app = createApp(App as Component);
app.use(PrimeVue, { ripple: false }); // Collect has no ripple
app.mount('#app');
