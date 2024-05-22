import PrimeVue from 'primevue/config';
import { type App } from 'vue';

export const webFormsPlugin = {
	install(app: App) {
		app.use(PrimeVue, { ripple: false }); // Collect has no ripple
	},
};
