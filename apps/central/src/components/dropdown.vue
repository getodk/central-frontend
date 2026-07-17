<template>
  <component :is="tag" ref="container" class="dropdown" :class="{ open: isOpen }">
    <slot name="toggle" :toggle="toggle" :is-open="isOpen" :attrs="triggerAttrs"></slot>
    <ul ref="menu" class="dropdown-menu" :style="menuStyle" :aria-labelledby="triggerId">
      <slot name="menu"></slot>
    </ul>
  </component>
</template>

<script setup>
import { computed, ref, useId } from 'vue';
import { computePosition } from '@floating-ui/dom';

import useEventListener from '../composables/event-listener';

defineOptions({
  name: 'Dropdown'
});

const props = defineProps({
  tag: {
    type: String,
    default: 'div'
  },
  placement: {
    type: String,
    default: 'bottom-end'
  }
});

const triggerId = `dropdown-${useId()}`;

const container = ref(null);
const menu = ref(null);
const isOpen = ref(false);
const menuStyle = ref({});

const triggerAttrs = computed(() => ({
  id: triggerId,
  'aria-haspopup': 'true',
  'aria-expanded': String(isOpen.value),
  class: 'dropdown-toggle'
}));

const updatePosition = async () => {
  if (menu.value == null || container.value == null) return;

  const triggerEl = container.value.querySelector('.dropdown-toggle');
  if (triggerEl == null) return;

  const { x, y } = await computePosition(triggerEl, menu.value, {
    placement: props.placement
  });

  menuStyle.value = {
    left: `${x}px`,
    top: `${y}px`
  };
};

const show = () => {
  if (isOpen.value) return;
  isOpen.value = true;
  updatePosition();
};

const hide = () => {
  if (!isOpen.value) return;
  isOpen.value = false;
  menuStyle.value = {};
};

const toggle = () => {
  if (isOpen.value) {
    hide();
  } else {
    show();
  }
};

const handleClickOutside = (event) => {
  if (!isOpen.value) return;

  // If clicked on trigger, the toggle handler will manage the state
  const clickedOnTrigger = container.value?.querySelector('.dropdown-toggle').contains(event.target);
  if (clickedOnTrigger) return;

  hide();
};

const handleEscape = (event) => {
  if (isOpen.value && event.key === 'Escape') {
    hide();
  }
};

useEventListener(document, 'click', handleClickOutside, true);
useEventListener(document, 'keydown', handleEscape);
useEventListener(window, 'resize', hide);
</script>
