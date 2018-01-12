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
  <div ref="modal" class="modal fade" tabindex="-1" role="dialog"
    :aria-labelledby="titleId" :data-backdrop="bsBackdrop"
    data-keyboard="false" @keydown.esc="$emit('hide')"
    @mousedown="modalMousedown($event)" @click="modalClick($event)">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" aria-label="Close"
            @click="$emit('hide')">
            <span aria-hidden="true">&times;</span>
          </button>
          <h4 class="modal-title" :id="titleId"><slot name="title"></slot></h4>
        </div>
        <div class="modal-body">
          <slot name="body"></slot>
        </div>
        <div class="modal-footer">
          <slot name="footer"></slot>
          <button type="button" class="btn btn-default" @click="$emit('hide')">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    state: Boolean,
    backdrop: Boolean
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
  mounted() {
    $(this.$refs.modal)
      .on('shown.bs.modal', () => this.$emit('shown'))
      .on('hidden.bs.modal', () => this.$emit('hidden'));
    this.toggle(this.state);
  },
  watch: {
    state(newState) {
      this.toggle(newState);
    }
  },
  beforeDestroy() {
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
      $(this.$refs.modal).modal(state ? 'show' : 'hide');
    },
    modalMousedown(e) {
      this.mousedownOutsideDialog = e.target === e.currentTarget;
    },
    modalClick(e) {
      const mouseupOutsideDialog = e.target === e.currentTarget;
      if (this.mousedownOutsideDialog && mouseupOutsideDialog)
        this.$emit('hide');
    }
  }
};
</script>
