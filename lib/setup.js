/*
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
import Vue from 'vue';
import axios from 'axios';

import GlobalComponents from './global-components';
import router from './router';
import { resetAuth } from './auth';
import { uniqueSequence } from './util';
import './jquery';
import './bootstrap';

axios.defaults.baseURL = '/api/v1';

Vue.config.productionTip = false;
GlobalComponents.register();

Vue.prototype.$logger = console;
Vue.prototype.$uniqueId = uniqueSequence();
Vue.prototype.$http = axios;

resetAuth();

export { router }; // eslint-disable-line import/prefer-default-export
