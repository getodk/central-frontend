<template>
  <component :is="tag" ref="container" :class="{ open: isOpen }">
    <slot name="toggle" :toggle="toggle" :is-open="isOpen" :attrs="triggerAttrs"></slot>
    <ul v-show="isOpen" ref="menu" class="dropdown-menu" :style="menuStyle">
      <slot name="menu"></slot>
    </ul>
  </component>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { computePosition } from '@floating-ui/dom';

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

const container = ref(null);
const menu = ref(null);
const isOpen = ref(false);
const menuStyle = ref({});

const triggerAttrs = computed(() => ({
  'aria-haspopup': 'true',
  'aria-expanded': String(isOpen.value)
}));

const updatePosition = async () => {
  if (menu.value == null || container.value == null) return;

  const triggerEl = container.value.firstElementChild;
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
  const clickedOnTrigger = container.value?.contains(event.target) &&
    !menu.value?.contains(event.target);
  if (clickedOnTrigger) return;

  hide();
};

const handleEscape = (event) => {
  if (isOpen.value && event.key === 'Escape') {
    hide();
  }
};

const handleResize = () => {
  if (isOpen.value) {
    hide();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true);
  document.addEventListener('keydown', handleEscape);
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true);
  document.removeEventListener('keydown', handleEscape);
  window.removeEventListener('resize', handleResize);
});
</script>
