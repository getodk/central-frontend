<template>
  <div id="entity-upload-extra-properties" @change="toggle">
    <div v-if="properties.length !== 1" class="checkbox">
      <label>
        <input type="checkbox" data-select-all="true">{{ $t('action.selectAll') }}
      </label>
    </div>
    <div v-for="name of properties" :key="name" class="checkbox">
      <label>
        <input type="checkbox" :value="name">
        <span v-tooltip.text>{{ name }}</span>
      </label>
    </div>
  </div>
</template>

<script setup>
defineOptions({
  name: 'EntityUploadExtraProperties'
});
defineProps({
  properties: {
    type: Array,
    required: true
  }
});
const emit = defineEmits(['toggle']);

const toggle = (event) => {
  const { target } = event;
  const { checked } = target;
  if (target.dataset.selectAll === 'true') {
    for (const input of event.currentTarget.querySelectorAll('input[value]')) {
      input.checked = checked;
      emit('toggle', input.value, checked);
    }
  } else {
    emit('toggle', target.value, checked);
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

#entity-upload-extra-properties {
  label { @include text-overflow-ellipsis; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      // This is the text of a button that allows the user to select all
      // columns.
      "selectAll": "Select all"
    }
  }
}
</i18n>
