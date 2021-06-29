import VueI18n from 'vue-i18n';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import { createLocalVue } from '@vue/test-utils';

const withRouter = createLocalVue();
withRouter.use(VueRouter);
withRouter.use(Vuex);
withRouter.use(VueI18n);

const withoutRouter = createLocalVue();
withoutRouter.use(Vuex);
withoutRouter.use(VueI18n);

export default { withRouter, withoutRouter };
