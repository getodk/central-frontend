import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

createApp(
	// ESLint can't agree with itself whether or not this module exists and has
	// known types.
	//
	// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
	App
).mount('#app');
