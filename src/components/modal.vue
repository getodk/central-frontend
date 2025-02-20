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

<!-- This component should not use v-bind:class on the .modal element. Bootstrap
may add the `in` class to the element, and the checkScroll() method may add the
`has-scroll` class. -->
<template>
  <div ref="el" class="modal" tabindex="-1"
    :data-backdrop="backdrop ? 'static' : 'false'" data-keyboard="false"
    role="dialog" :aria-labelledby="titleId" @mousedown="modalMousedown"
    @click="modalClick" @keydown.esc="hideIfCan" @focusout="refocus">
    <div class="modal-dialog" :class="sizeClass" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" :aria-disabled="!hideable"
            :aria-label="$t('action.close')" @click="hideIfCan">
            <span aria-hidden="true">&times;</span>
          </button>
          <h4 :id="titleId" class="modal-title"><slot name="title"></slot></h4>
        </div>
        <div ref="body" class="modal-body">
          <Alert/>
          <slot name="body"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
let id = 0;
</script>
<script setup>
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref, watch, watchPostEffect } from 'vue';
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

const props = defineProps({
  state: Boolean,
  // Indicates whether the user is able to hide the modal by clicking ×,
  // pressing escape, or clicking outside the modal.
  hideable: Boolean,
  // 'normal', 'large', or 'full'
  size: {
    type: String,
    default: 'normal'
  },
  backdrop: Boolean
});
const emit = defineEmits(['shown', 'hide', 'resize', 'mutate']);

const el = ref(null);
const body = ref(null);

// The modal() method of the Boostrap plugin
let bs;
onMounted(() => {
  if (el.value.closest('body') != null) {
    const wrapper = $(el.value);
    bs = wrapper.modal.bind(wrapper);
  } else {
    // We do not call modal() if the component is not attached to the document,
    // because modal() can have side effects on the document. Most tests do not
    // attach the component to the document.
    bs = noop;
  }
});

const alert = inject('alert');
let oldAlertAt;
watchPostEffect(() => { oldAlertAt = alert.at; });
watch(() => props.state, (state) => {
  if (state || alert.at === oldAlertAt) alert.blank();
});

// checkScroll() checks whether the modal vertically overflows the viewport,
// causing it to scroll. The function toggles the has-scroll class based on
// whether the modal overflows.
const checkScroll = () => {
  /* Before checking whether the modal overflows the viewport, we add the
  has-scroll class. The default assumption is that the modal may overflow. It's
  necessary to add the class, because if the modal currently doesn't have the
  class, and its content has just changed, it could be that its content doesn't
  overflow the viewport, yet does flow underneath .modal-actions. In that case,
  once we add the class, .modal-actions will be repositioned, and the content
  will start to overflow the viewport: the modal will be allowed to scroll as it
  should. */
  el.value.classList.add('has-scroll');
  if (el.value.scrollHeight === el.value.clientHeight)
    el.value.classList.remove('has-scroll');
};

let bodyHeight = 0;
const handleHeightChange = () => {
  // Call checkScroll() before measuring the height, as the has-scroll class can
  // affect the height.
  checkScroll();
  const newHeight = body.value.getBoundingClientRect().height;
  if (newHeight !== bodyHeight) {
    bs('handleUpdate');
    bodyHeight = newHeight;
    emit('resize', newHeight);
  }
};
const handleWindowResize = () => {
  // Most of the time, a window resize won't affect the height of the modal.
  // However, if props.size === 'full', it could.
  if (props.state && props.size === 'full') handleHeightChange();
};

let ignoreMutation = false;
const observer = new MutationObserver(() => {
  if (!props.state) return;
  handleHeightChange();
  if (!ignoreMutation) {
    emit('mutate');
    // Ignore mutations for a tick, effectively ignoring any mutations that the
    // `mutate` event handler just made. This helps prevent a loop such that a
    // mutation causes a `mutate` event, which causes the `mutate` handler to
    // make a mutation, which causes a `mutate` event, and so on.
    ignoreMutation = true;
    // The MutationObserver callback seems to be called in a microtask, so I
    // think nextTick() is the right choice and not setTimeout().
    nextTick(() => { ignoreMutation = false; });
  }
});

const show = () => {
  bs('show');
  checkScroll();
  bodyHeight = body.value.getBoundingClientRect().height;
  emit('resize', bodyHeight);
  observer.observe(body.value, {
    subtree: true,
    childList: true,
    attributes: true,
    characterData: true
  });
  window.addEventListener('resize', handleWindowResize);
  emit('shown');
};
const removeSelection = () => {
  const selection = getSelection();
  const { anchorNode } = selection;
  if (anchorNode != null && el.value.contains(anchorNode))
    selection.removeAllRanges();
};
const hide = () => {
  observer.disconnect();
  bs('hide');
  el.value.classList.remove('has-scroll');
  bodyHeight = 0;
  emit('resize', 0);
  window.removeEventListener('resize', handleWindowResize);
  removeSelection();
};
watch(() => props.state, (state) => {
  if (state)
    // The DOM hasn't updated yet, but it should be OK to show the modal now: I
    // think it will all happen in the same event loop.
    show();
  else
    hide();
});
onMounted(() => { if (props.state) show(); });
onBeforeUnmount(() => { if (props.state) hide(); });

const hideIfCan = () => { if (props.hideable) emit('hide'); };

const sizeClass = computed(() => {
  switch (props.size) {
    case 'large': return 'modal-lg';
    case 'full': return 'modal-full';
    default: return null; // 'normal'
  }
});

let mousedownOutsideDialog = false;
const modalMousedown = (event) => {
  mousedownOutsideDialog = event.target === event.currentTarget;
};
const modalClick = (event) => {
  const mouseupOutsideDialog = event.target === event.currentTarget;
  if (mousedownOutsideDialog && mouseupOutsideDialog) hideIfCan();
};

// Refocuses the modal if it has lost focus. This is needed so that the escape
// key still hides the modal.
const refocus = () => {
  /* As the user moves from one element in the modal to another, there may be
  the briefest moment when neither element is focused. We should not refocus the
  modal in that moment, because the second element will soon receive focus, and
  focusing the .modal element would prevent that. Thus, we use setTimeout() to
  give the second element time to receive focus. (Using nextTick() instead of
  setTimeout() didn't work.) */
  setTimeout(() => {
    // Do not focus the modal if it has lost focus after being hidden or
    // unmounted.
    if (!props.state || el.value == null) return;
    // Do not focus the .modal element if it is already focused or if it
    // contains the active element.
    if (document.activeElement != null &&
      document.activeElement.closest('.modal') === el.value)
      return;
    el.value.focus();
  });
};

id += 1;
const titleId = `modal-title${id}`;
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
      padding: 10px $padding-right-modal-header 9px $padding-left-modal-header;

      .close {
        color: #fff;
        font-weight: normal;
        margin-top: 0;
        opacity: 1;

        &[aria-disabled="true"] {
          cursor: not-allowed;
        }
      }

      h4 {
        @include text-overflow-ellipsis;
        font-size: 18px;
        font-weight: bold;
        letter-spacing: -0.02em;
      }
    }
  }
}

.modal-body { padding: $padding-modal-body; }

.modal-actions {
  background: $color-subpanel-background;
  border-top: 1px solid $color-subpanel-border;
  margin: -$padding-modal-body;
  margin-top: 20px;
  padding: 10px $padding-modal-body;
}

.modal-full {
  $margin: 15px;
  // Because we set margin-left and width, we don't need to set margin-right.
  margin: $margin 0 $margin $margin;
  // Subtract 10px so that there is space between the modal and the scrollbar.
  width: calc(100vw - #{2 * $margin + 10px});

  // 50px is the approximate height of .modal-header.
  .modal-body { min-height: calc(100vh - #{2 * $margin + 50px}); }

  // If .modal-body has so much content that it causes the modal to scroll, then
  // .modal-actions will naturally appear at the bottom of the modal as it
  // usually does. However, if the min height of the .modal-body is greater than
  // the height of its content, such that the modal doesn't scroll, then we need
  // to position .modal-actions at the bottom of the modal ourselves.
  .modal:not(.has-scroll) & .modal-actions {
    bottom: 0;
    left: 0;
    margin: 0;
    position: absolute;
    width: 100%;
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
