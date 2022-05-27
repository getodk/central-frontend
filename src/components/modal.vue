<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="modal" tabindex="-1" :data-backdrop="backdrop ? 'static' : 'false'"
    data-keyboard="false" role="dialog" :aria-labelledby="titleId"
    @mousedown="modalMousedown" @click="modalClick" @keydown.esc="hideIfCan"
    @focusout="refocus">
    <div class="modal-dialog" :class="{ 'modal-lg': large }" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" :disabled="!hideable"
            :aria-label="$t('action.close')" @click="hideIfCan">
            <span aria-hidden="true">&times;</span>
          </button>
          <h4 :id="titleId" class="modal-title"><slot name="title"></slot></h4>
        </div>
        <div ref="body" class="modal-body">
          <alert/>
          <slot name="body"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { inject, markRaw, watch, watchPostEffect } from 'vue';
import 'bootstrap/js/modal';

import Alert from './alert.vue';

import { noop } from '../util/util';

/*
We manually toggle the modal:

  - If the `backdrop` prop is `true`, we specify data-backdrop="static" rather
    than "true". We also add our own event listeners.
  - We specify data-keyboard="false" and add our own event listener.

We do this for two reasons:

  - It simplifies communication with the parent component: the modal hides only
    after the parent component sets the `state` prop to `false`.
  - It is needed to implement the `hideable` prop.
*/

let id = 0;

export default {
  name: 'Modal',
  components: { Alert },
  inject: ['alert'],
  props: {
    state: Boolean,
    // Indicates whether the user is able to hide the modal by clicking ×,
    // pressing escape, or clicking outside the modal.
    hideable: Boolean,
    backdrop: Boolean,
    large: Boolean
  },
  emits: ['shown', 'hide'],
  setup(props) {
    const alert = inject('alert');
    let oldAlertAt;
    watchPostEffect(() => { oldAlertAt = alert.at; });
    watch(() => props.state, (state) => {
      if (state || alert.at === oldAlertAt) alert.blank();
    });
  },
  data() {
    id += 1;
    return {
      id,
      // The modal() method of the Boostrap plugin
      bs: null,
      observer: markRaw(new MutationObserver(() => {
        if (this.state) this.bs('handleUpdate');
      })),
      mousedownOutsideDialog: false
    };
  },
  computed: {
    titleId() {
      return `modal-title${this.id}`;
    }
  },
  watch: {
    state(state) {
      if (state) {
        // The DOM hasn't updated yet, but it should be OK to show the modal
        // now: I think it will all happen in the same event loop.
        this.show();
      } else {
        this.hide();
      }
    }
  },
  mounted() {
    if (this.$el.closest('body') != null) {
      const wrapper = $(this.$el);
      this.bs = wrapper.modal.bind(wrapper);
    } else {
      // We do not call modal() if the component is not attached to the
      // document, because modal() can have side effects on the document. Most
      // tests do not attach the component to the document.
      this.bs = noop;
    }

    if (this.state) this.show();
  },
  beforeUnmount() {
    if (this.state) this.hide();
  },
  methods: {
    show() {
      this.bs('show');
      this.observer.observe(this.$refs.body, {
        subtree: true,
        childList: true,
        attributes: true,
        characterData: true
      });
      this.$emit('shown');
    },
    hide() {
      this.bs('hide');
      this.observer.disconnect();

      const selection = getSelection();
      const { anchorNode } = selection;
      if (anchorNode != null && this.$el.contains(anchorNode))
        selection.removeAllRanges();
    },
    hideIfCan() {
      if (this.hideable) this.$emit('hide');
    },
    modalMousedown(event) {
      this.mousedownOutsideDialog = event.target === event.currentTarget;
    },
    modalClick(event) {
      const mouseupOutsideDialog = event.target === event.currentTarget;
      if (this.mousedownOutsideDialog && mouseupOutsideDialog) this.hideIfCan();
    },
    // Refocuses the modal if it has lost focus. This is needed so that the
    // escape key still hides the modal.
    refocus() {
      /* As the user moves from one element in the modal to another, there may
      be the briefest moment when neither element is focused. We should not
      refocus the modal in that moment, because the second element will soon
      receive focus, and focusing the .modal element would prevent that. Thus,
      we use setTimeout() to give the second element time to receive focus.
      (Using this.$nextTick() instead of setTimeout() didn't work.) */
      setTimeout(() => {
        // Do not focus the modal if it has lost focus because it is hidden.
        if (!this.state) return;
        // Do not focus the .modal element if it is already focused or if it
        // contains the active element.
        if (document.activeElement != null &&
          document.activeElement.closest('.modal') === this.$el)
          return;
        this.$el.focus();
      });
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/mixins';

.modal-dialog {
  margin-top: 20vh;

  .modal-content {
    border: none;
    border-radius: 0;
    box-shadow: $box-shadow-panel-main;

    .modal-header {
      background-color: $color-accent-primary;
      color: #fff;
      padding: 10px 15px 9px;

      .close {
        color: #fff;
        font-weight: normal;
        margin-top: 0;
        opacity: 1;

        &[disabled] {
          cursor: not-allowed;
        }
      }

      h4 {
        font-size: 18px;
        font-weight: bold;
        letter-spacing: -0.02em;
      }
    }

    .modal-body {
      padding: $padding-modal-body;

      .form-group .form-control {
        background-color: $color-panel-input-background;
      }

      .modal-actions {
        background: $color-subpanel-background;
        border-top: 1px solid $color-subpanel-border;
        margin: -15px;
        margin-top: 20px;
        padding: 10px 15px;
      }
    }
  }
}

.modal-warnings, .modal-introduction, .modal-body .help-block {
  line-height: 1.2;
}

.modal-warnings, .modal-introduction {
  ul {
    @include text-list;

    margin-left: -5px;
  }
}

.modal-warnings {
  background-color: $color-warning-light;
  margin-bottom: 15px;
  padding: 15px;

  :last-child {
    margin-bottom: 0;
  }
}

.modal-introduction { margin-bottom: 18px; }
</style>
