<template>
  <dropdown ref="dropdownEl" id="custom-props-filter" tag="div"
    class="custom-props-filter form-group"
    placement="bottom-start" :close-on-menu-click="false"
    @show="onShow">
    <template #toggle="{ toggle, attrs }">
      <button v-bind="attrs" type="button" class="dropdown-trigger"
        @click="toggle">
        <span class="filter-label">{{ $t('resource.properties') }}</span>
        <span class="display-value" aria-hidden="true">{{ displayValue }}</span>
        <span class="icon-angle-down"></span>
      </button>
    </template>
    <template #menu>
      <li class="filter-row">
        <div class="form-group">
          <select v-model="pendingProperty" class="form-control property-select"
            :aria-label="$t('resource.property')">
            <option value="" disabled>{{ $t('resource.property') }}</option>
            <option v-for="p of actorProperties" :key="p.name" :value="p.name">
              {{ p.name }}
            </option>
          </select>
          <span class="equals-operator">=</span>
          <select v-model="pendingValue" class="form-control value-select"
            :disabled="pendingProperty === ''" :aria-label="$t('header.value')">
            <option value="" disabled>{{ $t('header.value') }}</option>
            <option v-for="v of availableValues" :key="v" :value="v">
              {{ v }}
            </option>
          </select>
          <button type="button" class="btn btn-trash"
            :aria-label="$t('action.clear')"
            :disabled="modelValue == null && pendingProperty === '' && pendingValue === ''"
            @click="clear">
            <span class="icon-trash" aria-hidden="true"></span>
          </button>
        </div>
      </li>
      <li class="action-bar">
        <button type="button" class="btn btn-primary apply-btn"
          :aria-disabled="pendingProperty === '' || pendingValue === ''"
          @click="apply">
          {{ $t('action.apply') }}
        </button>
      </li>
    </template>
  </dropdown>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Dropdown from './dropdown.vue';

defineOptions({
  name: 'CustomPropsFilter'
});

const props = defineProps({
  modelValue: {
    // null = no filter active; { property: string, value: string } = active filter
    type: [Object, null],
    default: null
  },
  actorProperties: {
    type: Array,
    required: true
  },
  actors: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const dropdownEl = ref(null);

// Pending state (before Apply)
const pendingProperty = ref('');
const pendingValue = ref('');

// All distinct non-empty values for the currently selected pending property
const availableValues = computed(() => {
  if (pendingProperty.value === '') return [];
  const values = new Set();
  for (const actor of props.actors) {
    const v = actor.properties?.[pendingProperty.value];
    if (v != null && v !== '') values.add(v);
  }
  return [...values].sort();
});

// When the property changes, reset the value selection
watch(pendingProperty, () => { pendingValue.value = ''; });

// Badge text shown on the trigger button
const displayValue = computed(() => {
  if (props.modelValue == null) return t('common.all');
  return `${props.modelValue.property} = ${props.modelValue.value}`;
});

const clear = () => {
  pendingProperty.value = '';
  pendingValue.value = '';
  emit('update:modelValue', null);
  dropdownEl.value?.hide();
};

const apply = () => {
  emit('update:modelValue', { property: pendingProperty.value, value: pendingValue.value });
  dropdownEl.value?.hide();
};

// Pre-populate pending fields from the applied value each time the dropdown opens
const onShow = () => {
  pendingProperty.value = props.modelValue?.property ?? '';
  pendingValue.value = props.modelValue?.value ?? '';
};
</script>

<style lang="scss">
@import '../assets/scss/mixins';
@import '../assets/scss/variables';

.custom-props-filter {
  .dropdown-trigger {
    @include filter-control;

    &:focus {
      outline: none;
      box-shadow: $btn-focus-box-shadow;
    }
  }

  .icon-angle-down {
    font-size: 16px;
    color: $color-input;
    font-weight: bold;
    pointer-events: none;
  }

  .display-value {
    height: 24px;
    min-width: 22px;
    padding: 4px 8px;
    border-radius: 100px;
    background: $color-action-light;
    border: none;
    color: $color-text;
    line-height: 16px;
  }

  .dropdown-menu {
    border-radius: 0;
    margin-top: 0;
    padding: 10px;
    min-width: 380px;
  }

  .filter-row {
    list-style: none;

    .form-group {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 0;
    }

    .property-select {
      flex: 1;
    }

    .equals-operator {
      font-weight: bold;
      color: $color-text;
      flex-shrink: 0;
    }

    .value-select {
      flex: 1;
    }

    .btn-trash {
      flex-shrink: 0;
      background: none;
      border: none;
      color: $color-text;
      padding: 4px;
      line-height: 1;

      &:hover:not(:disabled) {
        color: $color-danger;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }

  .action-bar {
    list-style: none;
    margin-top: 8px;

    .apply-btn {
      width: 100%;
    }
  }
}
</style>
