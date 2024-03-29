import PrimeVue from 'primevue/config';
import { type App } from 'vue';

const myPlugin = {
	install(app: App) {
		app.use(PrimeVue, { ripple: false });
	},
};

export default myPlugin;
