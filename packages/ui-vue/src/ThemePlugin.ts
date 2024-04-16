import PrimeVue from 'primevue/config';
import { type App } from 'vue';

const themePlugin = {
	install(app: App) {
		app.use(PrimeVue, { ripple: false });
	},
};

export default themePlugin;
