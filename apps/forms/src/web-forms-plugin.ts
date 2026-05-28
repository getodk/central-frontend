import { type App } from 'vue';
import { webFormsPlugin as webForms } from '@getodk/web-forms';

export const webFormsPlugin = {
	install(app: App) {
		app.use(webForms);
	},
};
