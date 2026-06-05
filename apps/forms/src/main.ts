import type { Component } from 'vue';
import { createApp } from 'vue';

import { webFormsPlugin } from '@getodk/web-forms';
import Forms from './Forms.vue';

import router from './router';
import { i18n } from './i18n'

const app = createApp(Forms as Component);
app.use(webFormsPlugin);
app.use(i18n);
app.use(router);
app.mount('#app');
