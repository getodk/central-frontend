import type { Component } from 'vue';
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import { odkThemePreset } from '../../../packages/web-forms/src/odk-theme-preset';

import { webFormsPlugin } from '@getodk/web-forms';
import Forms from './Forms.vue';

import router from './router';
import { i18n } from './i18n'
import initSentry from './utils/sentry';

import './assets/style.scss';

interface ClientConfig {
  sentryDsn?: string;
}

const fetchClientConfig = async (): Promise<ClientConfig> => {
  try {
    const response = await fetch('/client-config.json');
    return await response.json() as ClientConfig;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch /client-config.json', error);
    return {};
  }
};

const clientConfig = await fetchClientConfig();

const app = createApp(Forms as Component);
app.provide('clientConfig', clientConfig);
initSentry(app, 'web-forms', clientConfig.sentryDsn);
app.use(PrimeVue, { theme: { preset: odkThemePreset, options: { darkModeSelector: false } } });
app.use(webFormsPlugin);
app.use(i18n);
app.use(router);
app.mount('#forms-app');
