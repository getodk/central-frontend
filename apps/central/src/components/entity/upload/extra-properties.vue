<template>
  <div id="entity-upload-extra-properties" @change="toggle">
    <div v-if="properties.length !== 1" class="checkbox"
      :class="{ disabled: disabled || createdAll }">
      <label v-tooltip.sr-only>
        <input type="checkbox" :checked="selectedAll"
          :disabled="disabled || createdAll"
          :aria-describedby="createdAll ? disabledMessageId('all') : null"
          data-select-all="true">
        <span>{{ $t('action.selectAll') }}</span>
      </label>
      <p v-if="createdAll" :id="disabledMessageId('all')" class="sr-only">
        {{ $t('createdAll') }}
      </p>
    </div>
    <div v-for="(name, i) in properties" :key="name" class="checkbox"
      :class="{ disabled: disabled || created.has(name) }">
      <label v-tooltip.sr-only>
        <input type="checkbox" :value="name" :checked="selected.has(name)"
          :disabled="disabled || created.has(name)"
          :aria-describedby="created.has(name) ? disabledMessageId(i) : null">
        <span v-tooltip.text>{{ name }}</span>
      </label>
      <p v-if="created.has(name)" :id="disabledMessageId(i)" class="sr-only">
        {{ $t('created') }}
      </p>
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
  },
  created: {
    type: Set,
    required: true
  },
  disabled: Boolean
});
const emit = defineEmits(['toggle']);

const selectedAll = computed(() =>
  props.properties.every(name => props.selected.has(name)));
const createdAll = computed(() =>
  props.properties.every(name => props.created.has(name)));

const disabledMessageId = (suffix) => `entity-upload-extra-properties-disabled-${suffix}`;

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
    },
    "created": "This property was created in a previous upload attempt.",
    "createdAll": "All properties were created in a previous upload attempt."
  }
}
</i18n>
