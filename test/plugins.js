import VueCompositionAPI from '@vue/composition-api';
import VueI18n from 'vue-i18n';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import { createLocalVue } from '@vue/test-utils';

const localVue = createLocalVue();
localVue.use(VueCompositionAPI);
localVue.use(VueRouter);
localVue.use(Vuex);
localVue.use(VueI18n);
