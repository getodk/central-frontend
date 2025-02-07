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

<template>
  <div v-if="target != null" class="popover">
    <div class="popover-content">
      <slot></slot>
    </div>
    <div class="arrow"></div>
  </div>
</template>

<script>
import { arrow, computePosition, flip, inline, offset, shift } from '@floating-ui/dom';

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
  watch: {
    target(newTarget) {
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
    document.addEventListener('keydown', this.hideAfterEsc);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.hideAfterClick, true);
    window.removeEventListener('resize', this.hideAfterResize);
    document.removeEventListener('keydown', this.hideAfterEsc);
  },
  methods: {
    show() {
      const arrowEl = this.$el.querySelector('.arrow');

      computePosition(this.target, this.$el, {
        placement: this.placement,
        middleware: [
          offset(0),
          shift({ padding: 5 }),
          inline(),
          flip({ fallbackPlacements: ['bottom', 'left', 'right', 'top'] }),
          arrow({ element: arrowEl }),
        ]
      })
        .then(({ x, y, placement, strategy, middlewareData }) => {
          const { style } = this.$el;
          style.top = `${y}px`;
          style.left = `${x}px`;
          this.$el.classList.remove(...['top', 'right', 'bottom', 'left']);
          this.$el.classList.add(placement);
          style.position = strategy;

          const side = placement.split('-')[0];
          const staticSide = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right'
          }[side];

          if (middlewareData.arrow) {
            // eslint-disable-next-line no-shadow
            const { x, y } = middlewareData.arrow;
            // 10px represents the width of the popover arrow from Bootstrap CSS.
            Object.assign(arrowEl.style, {
              left: x != null ? `${x + 10}px` : '',
              top: y != null ? `${y + 10}px` : '',
              [staticSide]: y != null ? `${-arrowEl.offsetWidth}px` : `${-arrowEl.offsetHeight}px`
            });
          }
        });
    },
    hideAfterClick(event) {
      if (this.target != null &&
          ((event.target.closest('.popover') == null && !this.target.contains(event.target)) ||
            (event.target.hasAttribute('data-closes-popover'))))
        this.$emit('hide');
    },
    hideAfterResize() {
      if (this.target != null) this.$emit('hide');
    },
    hideAfterEsc({ key }) {
      if (this.target != null && key === 'Escape') this.$emit('hide');
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

.popover {
  display: block;
  border: none;
  box-shadow: $box-shadow-popover;
  font-family: inherit;
  max-width: none;
  padding: 0;
}

.popover-content { padding: 0; }

</style>
