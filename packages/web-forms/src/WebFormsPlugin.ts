import { odkThemePreset } from '@/odkThemePreset.ts';
import { type App } from 'vue';
import PrimeVue from 'primevue/config';

export const webFormsPlugin = {
	install(app: App) {
		app.use(PrimeVue, { theme: { preset: odkThemePreset, options: { darkModeSelector: false } } });
	},
};
