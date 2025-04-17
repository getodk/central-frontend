import type { Component } from 'vue';
import { createApp } from 'vue';

import { webFormsPlugin } from '../WebFormsPlugin';
import OdkWebFormDemo from './OdkWebFormDemo.vue';

import hankenGrotesk300 from '@fontsource/hanken-grotesk/300.css?inline';
import hankenGrotesk400 from '@fontsource/hanken-grotesk/400.css?inline';
import roboto300 from '@fontsource/roboto/300.css?inline';
import roboto400 from '@fontsource/roboto/400.css?inline';
import roboto500 from '@fontsource/roboto/500.css?inline';
import icomoon from '../assets/css/icomoon.css?inline';
// TODO/sk: Purge it - postcss-purgecss
import primeflex from 'primeflex/primeflex.css?inline';
import appStyles from '../assets/css/style.scss?inline';
import router from './router';

const styles = [
	icomoon,
	roboto300,
	roboto400,
	roboto500,
	hankenGrotesk300,
	hankenGrotesk400,
	primeflex,
	appStyles,
].join('\n\n');
const stylesheet = new CSSStyleSheet();

stylesheet.replaceSync(styles);

document.adoptedStyleSheets.push(stylesheet);

const app = createApp(OdkWebFormDemo as Component);
app.use(webFormsPlugin);
app.use(router);
app.mount('#app');
