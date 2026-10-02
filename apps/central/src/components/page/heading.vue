<template>
  <div class="page-heading">
    <div class="page-heading-left">
      <h1 class="page-heading-title">{{ title }}</h1>
      <button v-if="helpText || slots.help" type="button" class="page-heading-help"
        :aria-label="$t('helpButtonLabel')" @click="toggleHelp">
        <span class="icon-question-circle-o"></span>
      </button>
      <popover :target="popoverTarget" @hide="hideHelp">
        <div class="page-heading-help-content">
          <template v-if="helpText">{{ helpText }}</template>
          <slot v-else name="help" :hide="hideHelp"></slot>
        </div>
      </popover>
    </div>
    <div class="page-heading-right">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
import { ref, useSlots } from 'vue';
import Popover from '../popover.vue';

defineOptions({
  name: 'PageHeading'
});

defineProps({
  title: {
    type: String,
    required: true
  },
  helpText: String
});

const slots = useSlots();
const popoverTarget = ref(null);

const toggleHelp = (event) => {
  popoverTarget.value = popoverTarget.value == null ? event.currentTarget : null;
};

const hideHelp = () => {
  popoverTarget.value = null;
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

.page-heading {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.page-heading-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.page-heading-title {
  color: #000;
  font-size: 24px;
  font-weight: 400;
  margin: 0;
  white-space: nowrap;
}

.page-heading-help {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: $color-text;
  font-size: 18px;

  &:hover {
    color: $color-accent-primary;
  }

  &:focus {
    outline: none;
    color: $color-accent-primary;
  }
}

.page-heading-help-content {
  padding: 12px 16px;
  max-width: 300px;
  line-height: 1.5;
  color: $color-text;
}

.page-heading-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
</style>

<i18n lang="json5">
{
  "en": {
    "helpButtonLabel": "Click to view help text"
  }
}
</i18n>
