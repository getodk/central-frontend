import { createApp } from 'vue';
import type { Component } from 'vue';

import PrimeVue from 'primevue/config';
import App from './App.vue';

// Due to vite#11012, Roboto font files are manually copied in public/fonts folder.
import './themes/2024-light/theme.scss';

import './assets/css/style.css';

// TODO: Purge it - postcss-purgecss
import 'primeflex/primeflex.css';

const app = createApp(App as Component);
app.use(PrimeVue, { ripple: false }); // Collect has no ripple
app.mount('#app');
