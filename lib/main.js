import Vue from 'vue';
import axios from 'axios';

import App from './components/app.vue';
const globalComponents = [
  require('./components/error-message.vue'),
  require('./components/list-heading.vue')
];

Vue.config.productionTip = false;

// TODO: Don't hard-code base URL.
axios.defaults.baseURL = 'http://localhost:8383';

// Register global components.
// https://vuejs.org/v2/guide/components.html#Global-Registration
for (const component of globalComponents)
  Vue.component(component.name, component);

new Vue({
  el: '#app',
  render: (h) => h(App)
});
