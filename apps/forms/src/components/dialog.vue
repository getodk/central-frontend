<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from 'vue';
import { mdiCheckBold, mdiCloseThick } from '@mdi/js';

defineOptions({
  name: 'Dialog'
});

export type Status = 'loading' | 'error' | 'success';

export interface DialogProps {
  status: Status | undefined;
}
const props = defineProps<DialogProps>();

type DialogEmits = {
	close: [],
	retry: []
};

const emit = defineEmits<DialogEmits>();
const dialog = useTemplateRef('complete-dialog');

onMounted(() => {
  watch(() => props.status, (status) => {
    if (status == undefined) {
      // todo check what happens if we close a closed modal
      dialog.value?.close();
    } else {
      dialog.value?.showModal();
    }
  }, { immediate: true });
});
</script>

<style scoped>
dialog {
  width: 80vw;
  max-width: 600px;
  border: 0;
  border-radius: 6px;
  text-align: center;
  overflow: visible;
  color: #020617;
  outline: none;
  padding: 4rem 2rem 0;

  &::backdrop {
    background: #f1f5f9; /* make a variable */
  }

  pre {
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  footer {
    margin: 2rem 0;
  }
  .status {
    display: block;
    box-shadow: 0px 2px 12px 0px #0000001A;
    width: 100px;
    height: 100px;
    position: absolute;
    top: -50px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #ffffff;
    border-radius: 100%;
    padding: 20px;

    svg {
      border: 8px solid #0a80a3;
      border-radius: 100%;
      padding: 5px;
      width: 100%;
      height: 100%;
      display: block;
      margin: 0 auto;
      left: 0;
      right: 0;

      &.success {
        border-color: #0a80a3;
        fill: #0a80a3;
      }

      &.error {
        border-color: #c42b2b;
        fill: #c42b2b;
      }
    }
  }
  .spinner {
    width: 60px;
    height: 60px;
    border: 8px solid #f1f5f9;
    border-bottom-color: #0a80a3;
    border-radius: 50%;
    display: inline-block;
    box-sizing: border-box;
    animation: rotation 1s linear infinite;
  }
}
</style>

<style>
@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

<template>
  <dialog ref="complete-dialog">
    <span class="status">
      <span v-if="props.status === 'loading'" class="spinner"></span>
      <svg v-else :class="props.status === 'error' ? 'error' : 'success'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path :d="props.status === 'error' ? mdiCloseThick : mdiCheckBold" />
      </svg>
    </span>
    <h1><slot name="header"></slot></h1>
    <p><slot name="default"></slot></p>
    <footer><slot name="footer"></slot></footer>
  </dialog>
</template>
