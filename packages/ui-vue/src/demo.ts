import type { Component } from 'vue';
import { createApp } from 'vue';

import OdkWebFormDemo from './OdkWebFormDemo.vue';
import { webFormsPlugin } from './WebFormsPlugin';

import './assets/css/icomoon.css';
import './themes/2024-light/theme.scss';
// TODO/sk: Purge it - postcss-purgecss
import 'primeflex/primeflex.css';

import './assets/css/style.scss';

const app = createApp(OdkWebFormDemo as Component);
app.use(webFormsPlugin);
app.mount('#app');
