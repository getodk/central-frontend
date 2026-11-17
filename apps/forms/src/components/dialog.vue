<script setup lang="ts">
import { onMounted, useTemplateRef, watch } from 'vue';
import { mdiCheckBold, mdiCloseThick } from '@mdi/js';

defineOptions({
  name: 'Dialog'
});

export type Status = 'error' | 'loading' | 'none' | 'success';

export interface DialogProps {
  status: Status | undefined;
  hideable: boolean;
}
const props = defineProps<DialogProps>();

type DialogEmits = {
  close: [],
};
const emit = defineEmits<DialogEmits>();

const dialog = useTemplateRef('complete-dialog');

const onCancel = (event: Event) => {
  if (props.hideable) {
    emit('close');
  } else {
    // Safari doesn't have support for `closedby`
    event.preventDefault();
  }
};

onMounted(() => {
  watch(() => props.status, (status) => {
    if (status == undefined) {
      dialog.value?.close();
    } else {
      dialog.value?.showModal();
    }
  }, { immediate: true });
});
</script>

<template>
  <dialog ref="complete-dialog" :closedby="props.hideable ? 'any' : 'none'" @cancel="onCancel">
    <span class="status" v-if="props.status !== 'none'">
      <span v-if="props.status === 'loading'" class="spinner"></span>
      <svg v-else :class="props.status === 'error' ? 'error' : 'success'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path :d="props.status === 'error' ? mdiCloseThick : mdiCheckBold" />
      </svg>
    </span>
    <header><h1><slot name="header"></slot></h1></header>
    <div class="content"><slot name="default"></slot></div>
    <footer><slot name="footer"></slot></footer>
  </dialog>
</template>

<style scoped>
dialog {
  width: 80vw;
  max-width: 600px;
  margin-top: 25vh;
  max-height: 75vh;
  border: 0;
  border-radius: 6px;
  text-align: center;
  overflow: visible;
  outline: none;
  padding: 2rem;
  overflow-wrap: anywhere;

  &[open] {
    display: flex;
    flex-direction: column;
  }

  header,
  footer {
    flex-shrink: 0;
  }

  .content {
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  &:has(.status) {
    padding-top: 4rem;
  }

  &::backdrop {
    background: var(--odk-background-color);
  }

  h1 {
    font-weight: normal;
  }
  :deep(pre) {
    white-space: pre-wrap;
    overflow-wrap: break-word;
  }
  footer {
    margin-top: 2rem;
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
      border: 8px solid var(--odk-primary-text-color);
      border-radius: 100%;
      padding: 5px;
      width: 100%;
      height: 100%;
      display: block;
      margin: 0 auto;

      &.success {
        border-color: var(--odk-primary-text-color);
        fill: var(--odk-primary-text-color);
      }

      &.error {
        border-color: var(--odk-red-danger);
        fill: var(--odk-red-danger);
      }
    }
  }
  .spinner {
    width: 60px;
    height: 60px;
    border: 8px solid var(--odk-background-color);
    border-bottom-color: var(--odk-primary-text-color);
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
