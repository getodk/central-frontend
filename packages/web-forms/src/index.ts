import { webFormsPlugin } from './WebFormsPlugin';
import OdkWebForm from './components/OdkWebForm.vue';

import icomoon from './assets/css/icomoon.css?inline';
import theme from './themes/2024-light/theme.scss?inline';

// TODO/sk: Purge it - using postcss-purgecss
import primeflex from 'primeflex/primeflex.css?inline';

const styles = [icomoon, theme, primeflex].join('\n\n');
const stylesheet = new CSSStyleSheet();

stylesheet.replaceSync(styles);

document.adoptedStyleSheets.push(stylesheet);

export { OdkWebForm, webFormsPlugin };
