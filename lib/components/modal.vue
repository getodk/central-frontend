<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div ref="modal" class="modal" tabindex="-1" role="dialog"
    :aria-labelledby="titleId" :data-backdrop="bsBackdrop"
    data-keyboard="false" @keydown.esc="hideIfCan"
    @mousedown="modalMousedown($event)" @click="modalClick($event)">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" aria-label="Close"
            :disabled="!hideable" @click="hideIfCan">
            <span aria-hidden="true">&times;</span>
          </button>
          <h4 class="modal-title" :id="titleId"><slot name="title"></slot></h4>
        </div>
        <div class="modal-body">
          <slot name="body"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    state: {
      type: Boolean,
      default: false
    },
    backdrop: {
      type: Boolean,
      default: false
    },
    // Indicates whether the user is able to hide the modal by clicking ×,
    // pressing escape, or clicking outside the modal.
    hideable: {
      type: Boolean,
      default: false
    }
  },
  data() {
    const id = this.$uniqueId();
    return {
      titleId: `modal-title${id}`,
      mousedownOutsideDialog: false
    };
  },
  computed: {
    bsBackdrop() {
      // We use 'static' rather than 'true', because using 'true' would allow
      // the modal to be hidden without alerting the parent component. See
      // toggle() for more details.
      return this.backdrop ? 'static' : 'false';
    }
  },
  watch: {
    state(newState) {
      this.toggle(newState);
    }
  },
  mounted() {
    $(this.$refs.modal)
      .on('shown.bs.modal', () => this.$emit('shown'))
      .on('hidden.bs.modal', () => this.$emit('hidden'));
    if (this.state) this.toggle(this.state);
  },
  beforeDestroy() {
    this.toggle(false);
    $(this.$refs.modal).off();
  },
  methods: {
    /* toggle() manually toggles the modal. It is the only way the modal is
    shown or hidden: we do not use Bootstrap's listeners to toggle the modal. If
    we used Bootstrap's listeners to do so, the modal would be hidden without
    alerting the parent component, which would add complexity to communication
    between the modal and its parent. Foregoing those listeners also aids
    modularity, because parent components can use this modal component without
    knowing that it uses Bootstrap. */
    toggle(state) {
      // For tests in which the component is not attached to the document, we
      // return immediately rather than calling modal(), because it has side
      // effects on the document.
      if ($(this.$refs.modal).closest('body').length === 0) return;
      $(this.$refs.modal).modal(state ? 'show' : 'hide');
    },
    hideIfCan() {
      if (this.hideable) this.$emit('hide');
    },
    modalMousedown(e) {
      this.mousedownOutsideDialog = e.target === e.currentTarget;
    },
    modalClick(e) {
      const mouseupOutsideDialog = e.target === e.currentTarget;
      if (this.mousedownOutsideDialog && mouseupOutsideDialog) this.hideIfCan();
    }
  }
};
</script>

<style lang="sass">
@import '../../assets/scss/variables';

.modal-dialog {
  margin-top: 160px;

  .modal-content {
    border: none;
    border-radius: 0;
    box-shadow: 0 0 24px rgba(0, 0, 0, 0.25), 0 35px 115px rgba(0, 0, 0, 0.28);

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

    .modal-introduction {
      font-size: 14px;
      line-height: 1.2em;
      margin-bottom: 18px;
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
</style>
