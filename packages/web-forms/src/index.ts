import { webFormsPlugin } from './WebFormsPlugin';
import OdkWebForm from './components/OdkWebForm.vue';
import { POST_SUBMIT__NEW_INSTANCE } from './lib/constants/control-flow.ts';

// Applies styles when the Web Forms is used as a plugin outside the preview demo page.
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import './assets/css/icomoon.css';
// TODO/sk: Purge it - postcss-purgecss
import 'primeflex/primeflex.css';
import './assets/css/style.scss';

/**
 * @todo there are almost certainly types we should be exporting from the
 * package entrypoint!
 */
export { OdkWebForm, POST_SUBMIT__NEW_INSTANCE, webFormsPlugin };
