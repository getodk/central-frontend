import { odkThemePreset } from './odk-theme-preset.ts';
import { type App } from 'vue';
import PrimeVue from 'primevue/config';
import KeyFilter from 'primevue/keyfilter';
import resetStyles from './assets/styles/reset.scss?raw';

export const webFormsPlugin = {
  install(app: App) {
    const styleElement = document.createElement('style');
    styleElement.textContent = resetStyles;
    document.head.prepend(styleElement);

    app.use(PrimeVue, { theme: { preset: odkThemePreset, options: { darkModeSelector: false } } });
    app.directive('keyfilter', KeyFilter);
  },
};
