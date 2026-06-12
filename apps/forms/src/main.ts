import type { Component } from 'vue';
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import { odkThemePreset } from '../../../packages/web-forms/src/odk-theme-preset';

import { webFormsPlugin } from '@getodk/web-forms';
import Forms from './Forms.vue';

import router from './router';
import { i18n } from './i18n'

const app = createApp(Forms as Component);
app.use(PrimeVue, { theme: { preset: odkThemePreset, options: { darkModeSelector: false } } });
app.use(webFormsPlugin);
app.use(i18n);
app.use(router);
app.mount('#app');
