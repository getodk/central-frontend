/*
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
*/
export default {
  state: {
    ref: null
  },
  mutations: {
    /* eslint-disable no-param-reassign */
    setModalRef(state, ref) {
      state.ref = ref;
    }
    /* eslint-enable no-param-reassign */
  },
  actions: {
    showModal({ commit }, ref) {
      const $ref = $(ref);
      // We do not call $ref.modal('show') if the component is not attached to
      // the document, because modal() has side effects on the document. Most
      // tests do not attach the component to the document.
      if ($ref.closest('body').length !== 0) $ref.modal('show');
      commit('setModalRef', ref);
    },
    hideModal({ state, commit }) {
      const $ref = $(state.ref);
      // We do not call $ref.modal('hide') if the component is not attached to
      // the document, because modal() has side effects on the document. Most
      // tests do not attach the component to the document.
      if ($ref.closest('body').length !== 0) $ref.modal('hide');
      commit('setModalRef', null);
    }
  }
};
