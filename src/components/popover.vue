<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<!--
The Popover component renders the content of a popover, then passes the
resulting HTML to the Bootstrap popover plugin. That means that this component
does not contain the popover content shown to the user; the actual popover
content is a copy based on this component. This component is rendered, but
hidden.

This setup results in a few limitations:

  - The HTML passed to the Bootstrap plugin is not reactive, so the popover must
    be destroyed and reinitialized whenever its content changes. To do so, call
    the update() method.
  - We can't pass event handlers to the Bootstrap plugin, so don't use Vue event
    handling to listen for events. Instead, manually attach event listeners to
    the document and use event delegation.
  - Since the popover content is rendered here and also shown in the .popover
    element, avoid using an id attribute.

If any of these limitations becomes an issue, we could consider moving to a Vue
implementation of the Bootstrap plugins. We could also consider implementing our
own popover functionality, perhaps using Popper.
-->
<template>
  <div class="popover-content-source">
    <slot></slot>
  </div>
</template>

<script>
import { markRaw } from 'vue';
import 'bootstrap/js/tooltip';
import 'bootstrap/js/popover';

export default {
  name: 'Popover',
  props: {
    // The element that triggered the popover. If `null`, the popover is hidden.
    target: HTMLElement, // eslint-disable-line vue/require-default-prop
    placement: {
      type: String,
      default: 'right'
    }
  },
  emits: ['hide'],
  data() {
    return {
      // jQuery wrapper of this.target
      wrapper: null
    };
  },
  watch: {
    target(newTarget, oldTarget) {
      if (oldTarget != null) this.hide();
      if (newTarget != null) this.$nextTick(this.show);
    }
  },
  mounted() {
    if (this.target != null) this.$nextTick(this.show);

    // A click may hide the current popover. It may also show a new popover. In
    // order to have the correct order of actions in that case (hide, then show,
    // not show, then hide), we use event capturing here.
    document.addEventListener('click', this.hideAfterClick, true);
    window.addEventListener('resize', this.hideAfterResize);
  },
  beforeUnmount() {
    if (this.target != null) this.hide();
    document.removeEventListener('click', this.hideAfterClick, true);
    window.removeEventListener('resize', this.hideAfterResize);
  },
  methods: {
    show() {
      this.wrapper = markRaw($(this.target)
        .popover({
          container: 'body',
          content: this.$el.innerHTML,
          html: true,
          placement: this.placement,
          trigger: 'manual',
          animation: false
        })
        .popover('show'));
    },
    hide() {
      this.wrapper.popover('destroy');
      this.wrapper = null;
    },
    // Popper is a popular popover package that also requires a method call
    // after the height of a popover changes. However, Popper only repositions
    // the popover. This method destroys the popover and reinitializes it; the
    // Bootstrap plugin does not provide another way to reposition the popover
    // and its arrow.
    update() {
      this.hide();
      this.show();
    },
    hideAfterClick(event) {
      if (this.target != null && event.target.closest('.popover') == null &&
        !this.target.contains(event.target))
        this.$emit('hide');
    },
    hideAfterResize() {
      if (this.target != null) this.$emit('hide');
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

.popover {
  border: none;
  box-shadow: $box-shadow-popover;
  font-family: inherit;
  max-width: none;
  padding: 0;

  &.left > .arrow { border-left-color: rgba(0, 0, 0, 0.125); }
}

.popover-content { padding: 0; }
.popover-content-source { display: none; }
</style>
