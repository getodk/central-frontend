<template>
  <div id="entity-upload-extra-properties" @change="toggle">
    <div v-if="properties.length !== 1" class="checkbox">
      <label>
        <input type="checkbox" :checked="selectedAll" data-select-all="true">
        <span>{{ $t('action.selectAll') }}</span>
      </label>
    </div>
    <div v-for="name of properties" :key="name" class="checkbox">
      <label>
        <input type="checkbox" :value="name" :checked="selected.has(name)">
        <span v-tooltip.text>{{ name }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

defineOptions({
  name: 'EntityUploadExtraProperties'
});
const props = defineProps({
  properties: {
    type: Array,
    required: true
  },
  selected: {
    type: Set,
    required: true
  }
});
const emit = defineEmits(['toggle']);

const selectedAll = computed(() =>
  props.properties.every(name => props.selected.has(name)));

const toggle = (event) => {
  const input = event.target;
  const { checked } = input;
  if (input.dataset.selectAll === 'true') {
    for (const name of props.properties) {
      if (props.selected.has(name) !== checked) emit('toggle', name, checked);
    }
  } else {
    emit('toggle', input.value, checked);
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

#entity-upload-extra-properties {
  max-height: 350px;
  overflow-y: auto;
  padding-inline: 8px;

  .checkbox {
    margin-block: 0;
    padding-block: 3px;
    padding-left: 10px;

    &:first-child { padding-left: 0; }
  }

  label { @include text-overflow-ellipsis; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      // This is the text of a button that allows the user to select all the
      // columns of a table.
      "selectAll": "Select all"
    }
  }
}
</i18n>
