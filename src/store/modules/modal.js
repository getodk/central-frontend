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
    // jQuery wrapper of the .modal element that is currently shown
    wrapper: null
  },
  getters: {
    modalShown: ({ wrapper }) => wrapper != null
  },
  mutations: {
    /* eslint-disable no-param-reassign */
    setModalWrapper(state, wrapper) {
      state.wrapper = wrapper;
    }
    /* eslint-enable no-param-reassign */
  },
  actions: {
    showModal({ commit }, element) {
      const wrapper = $(element);
      // We do not call .modal('show') if the component is not attached to the
      // document, because .modal() has side effects on the document. Most tests
      // do not attach the component to the document.
      if (wrapper.closest('body') != null) wrapper.modal('show');
      commit('setModalWrapper', wrapper);
    },
    hideModal({ state, commit }) {
      const { wrapper } = state;
      if (wrapper.closest('body') != null) wrapper.modal('hide');
      commit('setModalWrapper', null);
    }
  }
};
