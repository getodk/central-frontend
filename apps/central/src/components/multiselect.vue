<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div ref="dropdown" class="multiselect form-group">
    <!-- Specifying @mousedown.prevent so that clicking the select element does
    not show a menu with the placeholder option. This approach seems to work
    across browsers. -->
    <div ref="toggle" class="dropdown-trigger"
      :class="{ disabled }"
      :data-toggle="(options == null || disabled) ? null : 'dropdown'">
      <slot name="icon"></slot>
      <span class="multiselect-label">{{ label }}</span>
      <select :id="toggleId" class="display-value"
        :aria-disabled="options == null || disabled"
        role="button"
        v-tooltip.aria-describedby="disabledMessage"
        aria-haspopup="true" aria-expanded="false" :aria-label="label"
        @keydown="toggleAfterEnter" @mousedown.prevent @click="verifyAttached">
        <option value="">{{ selectOption }}</option>
      </select>
      <span class="icon-angle-down"></span>
    </div>
    <!-- Specifying @click.stop so that clicking the .dropdown-menu does not
    hide it. -->
    <ul class="dropdown-menu" :aria-labelledby="toggleId" @click.stop>
      <li v-if="search != null" class="search">
        <div class="form-group">
          <span class="icon-search"></span>
          <input ref="searchInput" v-model="searchValue" class="form-control"
            :placeholder="search" :aria-label="search" autocomplete="off">
          <button v-show="searchValue !== ''" type="button" class="close"
            :aria-label="$t('action.clear')" @click="clearSearch">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </li>
      <li class="change-all">
        <button type="button"
          class="btn btn-outlined select-all" @click.prevent="changeAll(true)">
          {{ all }}
        </button>
        <button type="button"
          class="btn btn-outlined select-none" @click.prevent="changeAll(false)">
         {{ none }}
        </button>
      </li>
      <li>
        <ul ref="optionList" class="option-list"
          :class="{ 'shows-all': searchValue === '' }" @change="changeCheckbox">
          <template v-if="options != null">
            <!-- eslint-disable-next-line vue/object-curly-newline -->
            <li v-for="({ value, key = value, text = value, description }, i) in options"
              :key="key" :class="{ 'search-match': searchMatches.has(value) }">
              <div class="checkbox">
                <label>
                  <input type="checkbox" :data-index="i"
                    :aria-describedby="description != null ? descriptionId(i) : null">
                  <span v-if="description == null" v-tooltip.text>{{ text }}</span>
                  <span v-else v-tooltip.no-aria="description">{{ text }}</span>
                </label>
                <p v-if="description != null" :id="descriptionId(i)" class="sr-only">{{ description }}</p>
              </div>
            </li>
          </template>
          <li class="empty-message">{{ emptyMessage }}</li>
        </ul>
      </li>
      <li class="after-list">
        <slot name="after-list" :selected="selected"></slot>
      </li>
      <li class="action-bar">
        <button type="button" class="btn btn-primary" :aria-disabled="changes.size === 0" @click="apply()">
         {{ $t('action.apply') }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script>
let id = 1;
</script>
<script setup>
import { computed, inject, onMounted, onUnmounted, ref, shallowReactive, watch, watchEffect } from 'vue';

import { noop } from '../util/util';

const props = defineProps({
  /*
  `options` specifies the list of possible options. Each option specifies a
  value, as well as optionally text and other properties:

    - value. This property is required. It specifies a unique value for the
      option, which will be emitted for props.modelValue if the option is
      selected.
    - key. The Multiselect component uses the `key` attribute to uniquely
      identify options. By default, Multiselect passes the `value` property to
      the `key` attribute. However, if `value` is not a primitive, then you must
      specify a different value using the `key` property. In that case, the
      `key` property should be a function of `value`: for example, if `value`
      changes, then `key` should also change.
    - text. The text to show for the option. Defaults to the `value` property.
    - description (optional). Additional text to show for the option. This will
      be shown in a tooltip and used as the ARIA description of the checkbox.

  If `options` is `null` (for example, because the options are loading), then
  the dropdown will not be shown.

  The component assumes that `options` will not change while the dropdown is
  shown.
  */
  options: {
    type: Array,
    required: false
  },
  // props.modelValue is an array of the values of the options that have been
  // selected. Every value in modelValue should also be in props.options, unless
  // props.options is `null`. The relative order of the values in modelValue may
  // differ from their relative order in props.options. The component assumes
  // that modelValue will not change while the dropdown is shown.
  modelValue: {
    type: Array,
    required: true
  },
  // By default, the user can uncheck all options. However, if defaultToAll is
  // `true`, then at least one option must be selected. If all options are
  // unchecked, then the selection falls back to all options. That can be useful
  // in cases where selecting none is guaranteed to lead to an empty result.
  defaultToAll: Boolean,

  // `true` if the options are loading and `false` if not.
  loading: Boolean,

  // Text, including for form controls and actions
  label: {
    type: String,
    required: true
  },
  placeholder: {
    type: Function,
    required: true
  },
  all: {
    type: String,
    required: true
  },
  none: {
    type: String,
    required: true
  },
  search: {
    type: String,
    required: false
  },
  empty: {
    type: String,
    required: false
  },

  // disabled the control
  disabled: {
    type: Boolean,
    default: false
  },
  disabledMessage: {
    type: String,
    required: false
  }
});
const emit = defineEmits(['update:modelValue']);

const { i18n, buildMode } = inject('container');

const idPrefix = `multiselect${id}`;
id += 1;
const toggleId = `${idPrefix}-toggle`;
const descriptionId = (i) => `${idPrefix}-description${i}`;

const optionList = ref(null);



////////////////////////////////////////////////////////////////////////////////
// SYNC props.modelValue AND CHECKBOXES

/*
We try to keep props.modelValue and the checkboxes in sync. Either one can
change the other. If props.modelValue changes, then the component updates the
checkboxes. And if the user changes one or more checkboxes, then once the
dropdown is hidden, the component emits an update:modelValue event. (The parent
component is allowed to ignore that event, in which case props.modelValue and
the checkboxes will remain out-of-sync.)

To help keep props.modelValue and the checkboxes in sync, we use `selected` to
track the values of the selected options. `selected` matches which checkboxes
are checked.

We also use `changes` to track the user's changes since the dropdown was shown.
`changes` is cleared when the dropdown is hidden and the update:modelValue event
emitted regardless of whether the parent component actually changes
props.modelValue. In other words, `changes` tracks the difference between the
current selection and the selection when the dropdown was shown. That may be the
same as the difference between props.modelValue and the checkboxes, but it might
not be (if an update:modelValue event was ignored).
*/

// `selected` needs to be reactive for the after-list slot.
const selected = shallowReactive(new Set());
const changes = shallowReactive(new Set());
const change = (value) => {
  if (selected.has(value))
    selected.delete(value);
  else
    selected.add(value);

  if (changes.has(value))
    changes.delete(value);
  else
    changes.add(value);
};

let needsSync = true;
// Syncs the checkboxes and `selected` with props.modelValue.
const syncWithModelValue = () => {
  if (!needsSync) return;

  selected.clear();
  for (const value of props.modelValue) selected.add(value);

  const checkboxes = optionList.value.querySelectorAll('input');
  for (let i = 0; i < checkboxes.length; i += 1)
    checkboxes[i].checked = selected.has(props.options[i].value);

  needsSync = false;
};

const changeCheckbox = ({ target }) => {
  change(props.options[target.dataset.index].value);
};

// emittedValue is used for an optimization, to avoid an unnecessary sync.
// Unless it is `null`, it holds the last value emitted since props.modelValue
// was last set. It equals `null` if no value has been emitted since then (or if
// no value has ever been emitted).
let emittedValue = null;
const emitIfChanged = () => {
  if (changes.size === 0) return;
  changes.clear();

  if (props.defaultToAll && selected.size === 0) {
    if (props.modelValue.length === props.options.length) {
      // If props.modelValue is already all options, then there hasn't been a
      // change. We don't need to emit a new value, but we do need to sync the
      // checkboxes.
      needsSync = true;
    } else {
      // Setting emittedValue to `null` so that checkboxes are synced.
      emittedValue = null;
      emit('update:modelValue', props.options.map(({ value }) => value));
    }
  } else {
    emittedValue = [...selected];
    emit('update:modelValue', emittedValue);
  }
};

watch(
  () => props.modelValue,
  (modelValue) => {
    // If modelValue === emittedValue, then we don't need to sync anything.
    if (modelValue !== emittedValue) {
      /* We set needsSync rather than immediately calling syncWithModelValue().
      We do that for two reasons. First, and most importantly, if
      props.modelValue and props.options are both changed in the same tick, then
      any checkboxes for new options won't be rendered yet. Second, if
      props.modelValue will change multiple times while the dropdown is hidden,
      syncing multiple times is unnecessary. */
      needsSync = true;
      // syncWithModelValue() will also clear `selected`, but we might as well
      // free up the memory now.
      selected.clear();
    }

    emittedValue = null;
  },
  { deep: true }
);

if (buildMode === 'development') {
  const optionValues = computed(() =>
    props.options.reduce((set, { value }) => set.add(value), new Set()));
  const notFound = computed(() =>
    props.modelValue.find(value => !optionValues.value.has(value)));
  watchEffect(() => {
    if (props.options != null && notFound.value != null) {
      // eslint-disable-next-line no-console
      console.warn('modelValue not among options', {
        options: props.options,
        modelValue: props.modelValue,
        notFound: notFound.value
      });
    }
  });
}



////////////////////////////////////////////////////////////////////////////////
// SEARCH

const searchValue = ref('');
const searchMatches = shallowReactive(new Set());
const textToSearch = computed(() => props.options.map(option => {
  const text = option.text != null ? option.text : option.value.toString();
  const result = [text.toLocaleLowerCase(i18n.locale)];
  const { description } = option;
  if (description != null && description !== text)
    result.push(description.toLocaleLowerCase(i18n.locale));
  return result;
}));
// We may need to add debouncing here at some point.
watch(searchValue, (value) => {
  searchMatches.clear();
  if (value === '') return;
  const searchToLowerCase = value.toLocaleLowerCase(i18n.locale);
  for (let i = 0; i < props.options.length; i += 1) {
    if (textToSearch.value[i].some(text => text.includes(searchToLowerCase)))
      searchMatches.add(props.options[i].value);
  }
});

const searchInput = ref(null);
const clearSearch = () => {
  searchValue.value = '';
  searchInput.value.focus();
};

// Fix the width of .option-list during search so that it doesn't change based
// on the search results. The width won't change even if the scrollbar
// disappears or reappears during the search.
watch(searchValue, (value) => {
  const { style } = optionList.value;
  if (value === '') {
    style.width = '';
  } else if (style.width === '') {
    const { width } = optionList.value.getBoundingClientRect();
    style.width = `${width}px`;
  }
});



////////////////////////////////////////////////////////////////////////////////
// BOOTSTRAP DROPDOWN

const dropdown = ref(null);
const $dropdown = computed(() => $(dropdown.value));
onMounted(() => {
  $dropdown.value.on('shown.bs.dropdown', syncWithModelValue);
  $dropdown.value.on('hidden.bs.dropdown', () => {
    searchValue.value = '';
    needsSync = changes.size !== 0;
    changes.clear();
  });
});
onUnmounted(() => { $dropdown.value.off('.bs.dropdown'); });

//  this should be changed i think
const toggle = ref(null);
const $toggle = computed(() => $(toggle.value));
const toggleAfterEnter = ({ key }) => {
  // console.log('toggleAfterEnter');
  if (key === 'Enter') $toggle.value.dropdown('toggle');
};

const apply = () => {
  searchValue.value = '';
  emitIfChanged();
  $toggle.value.dropdown('toggle');
};

const verifyAttached = buildMode === 'test'
  ? ({ target }) => {
    if (target.closest('body') == null)
      // eslint-disable-next-line no-console
      console.error('Clicking Multiselect toggle has no effect unless component is attached to body.');
  }
  : noop;



////////////////////////////////////////////////////////////////////////////////
// SELECT ALL / NONE

// `true` for select all, `false` for select none.
const changeAll = (selectAll) => {
  if (selected.size === (selectAll ? props.options.length : 0)) return;
  const selector = [selectAll ? 'input:not(:checked)' : 'input:checked'];
  if (searchValue.value !== '') selector.unshift('.search-match');
  for (const input of optionList.value.querySelectorAll(selector.join(' '))) {
    input.checked = selectAll;
    change(props.options[input.dataset.index].value);
  }
};



////////////////////////////////////////////////////////////////////////////////
// OTHER PROPS

// Implements props.loading and props.placeholder.
const selectOption = computed(() => {
  if (props.loading) return i18n.t('common.loading');
  if (props.options == null) return i18n.t('common.error');
  const { placeholder } = props;
  return placeholder({
    selected: i18n.n(props.modelValue.length, 'default'),
    total: i18n.n(props.options.length, 'default')
  });
});

// Implements props.empty.
const emptyMessage = computed(() => (searchValue.value === ''
  ? (props.options != null && props.options.length === 0
    ? (props.empty != null ? props.empty : i18n.t('common.noResults'))
    : '')
  : (searchMatches.size === 0 ? i18n.t('common.noResults') : '')));
</script>

<style lang="scss">
@import '../assets/scss/mixins';
@import '../assets/scss/variables';

.multiselect {

  .dropdown-trigger {
    @include filter-control;
  }

  select {
    appearance: none;
  }

  .icon-angle-down {
    font-size: 16px;
    color: #555555;
    font-weight: bold;
    pointer-events: none;
    z-index: 1;
  }

  $line-height: 1;
  .dropdown-menu {
    border-radius: 0;
    line-height: $line-height;
    margin-top: 0;
    padding-bottom: 0;
    padding: 5px;
    min-width: 200px;
  }

  $hpadding: 9px;
  $vpadding: 6px;
  .search {
    padding: $vpadding $hpadding;

    // The Multiselect component may be inside a .form-inline.
    .form-group {
      @include filter-control;
      width: 100%;
    }

    .form-control {
      background-color: #fff;
      display: block;
      font-size: $font-size-dropdown-menu;
      height: auto;
      line-height: $line-height;
      // padding-right for the .close button.
      padding: 0 16px 0 0;
      width: 100%;

      &::placeholder {
        color: $color-text-secondary;
      }
      &:lang(ja), &:lang(zh) {
        &::placeholder {
          font-style: normal;
          font-weight: bold;
        }
      }
    }

    .close {
      font-size: 18px;
      position: static;
    }
  }

  .change-all {
    padding: #{0.5 * $vpadding} $hpadding $vpadding;
    display: flex;
    gap: 10px;

    button {
      flex: 1 1 50%;
      line-height: 15px;
    }
  }

  .option-list {
    background-color: #FFF;
    font-size: 14px;
    list-style: none;
    max-height: 250px;
    overflow: visible auto;
    padding-bottom: 3px;
    padding-left: 0;
    padding-top: $vpadding;

    li {
      display: none;
      max-width: 265px;
      padding-left: $hpadding;
      padding-right: $hpadding;
    }
    &.shows-all li, li.search-match { display: list-item; }

    .checkbox {
      display: block;
      label { @include text-overflow-ellipsis; }
    }

    input[type="checkbox"] {
      margin-top: 0;
      margin-right: 5px;
    }

    .empty-message {
      display: list-item;
      // 22px is the same as the other <li> elements.
      height: 22px;
      // Give .empty-message a larger max-width to help it not wrap.
      max-width: 375px;
      padding-top: 3px;
      // This seems to be needed for .empty-message to use the full max-width
      // available to it.
      width: max-content;

      &:empty { display: none; }
    }
  }

  .after-list {
    padding: $vpadding $hpadding;

    &:empty { display: none; }
  }
  .action-bar {
    margin-top: 5px;

    button {
      width: 100%;
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "apply": "Apply"
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "action": {
      "apply": "Anwenden"
    }
  },
  "es": {
    "action": {
      "apply": "Aplicar"
    }
  },
  "fr": {
    "action": {
      "apply": "Appliquer"
    }
  },
  "it": {
    "action": {
      "apply": "Applica"
    }
  },
  "pt": {
    "action": {
      "apply": "Aplicar"
    }
  },
  "zh": {
    "action": {
      "apply": "应用"
    }
  },
  "zh-Hant": {
    "action": {
      "apply": "應用"
    }
  }
}
</i18n>
