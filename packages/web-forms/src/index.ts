import { webFormsPlugin } from './WebFormsPlugin';
import OdkWebForm from './components/OdkWebForm.vue';
import { POST_SUBMIT__NEW_INSTANCE } from './lib/constants/control-flow.ts';

import '@fontsource/roboto/300.css';
import './assets/css/icomoon.css';
import './themes/2024-light/theme.scss';

// TODO/sk: Purge it - using postcss-purgecss
import 'primeflex/primeflex.css';

/**
 * @todo there are almost certainly types we should be exporting from the
 * package entrypoint!
 */
export { OdkWebForm, POST_SUBMIT__NEW_INSTANCE, webFormsPlugin };
