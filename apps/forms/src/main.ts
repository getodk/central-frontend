import type { Component } from 'vue';
import { createApp } from 'vue';

import { webFormsPlugin } from './web-forms-plugin.ts';
import Forms from './Forms.vue';

import router from './router';

const app = createApp(Forms as Component);
app.use(webFormsPlugin);
app.use(router);
app.mount('#app');
