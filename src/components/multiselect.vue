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
    <select :id="toggleId" ref="toggle" class="form-control"
      :disabled="options == null" data-toggle="dropdown" role="button"
      aria-haspopup="true" aria-expanded="false" :aria-label="label"
      @keydown="toggleAfterEnter" @mousedown.prevent>
      <option value="">{{ selectOption }}</option>
    </select>
    <span class="form-label">{{ label }}</span>
    <!-- Specifying @click.stop so that clicking the .dropdown-menu does not
    hide it. -->
    <ul class="dropdown-menu" :aria-labelledby="toggleId" @click.stop>
      <li v-if="search != null" class="search">
        <div class="form-group">
          <input ref="searchInput" v-model="searchValue" class="form-control"
            :placeholder="search" :aria-label="search" autocomplete="off">
          <button v-show="searchValue !== ''" type="button" class="close"
            :aria-label="$t('action.clear')" @click="clearSearch">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </li>
      <li class="toggle-all">
        <i18n-t tag="div" keypath="action.select">
          <template #all>
            <a class="select-all" href="#" role="button" @click.prevent="selectAll">{{ all }}</a>
          </template>
          <template #none>
            <a class="select-none" href="#" role="button" @click.prevent="selectNone">{{ none }}</a>
          </template>
        </i18n-t>
      </li>
      <li>
        <ul ref="optionList" class="option-list"
          :class="{ 'shows-all': searchValue === '' }" @change="changeCheckbox">
          <template v-if="options != null">
            <li v-for="({ value, key = value, text = value, title = text }, i) in options"
              :key="key" :class="{ 'search-match': searchMatches.has(value) }">
              <div class="checkbox">
                <label>
                  <input type="checkbox" :data-index="i">
                  <span :title="title">{{ text }}</span>
                </label>
              </div>
            </li>
          </template>
          <li class="empty-message">{{ emptyMessage }}</li>
        </ul>
      </li>
      <li class="after-list"><slot name="after-list"></slot></li>
    </ul>
  </div>
</template>

<script>
let id = 1;
</script>
<script setup>
import { computed, inject, onBeforeUnmount, onMounted, onUnmounted, ref, shallowReactive, shallowRef, watch, watchEffect } from 'vue';

const props = defineProps({
  /*
  `options` specifies the list of possible options. Each option specifies a
  value, as well as optionally text and other properties:

    - value. This property is required. It specifies the unique value for the
      option, which will be emitted for props.modelValue if the option is
      selected.
    - key. The Multiselect component uses the `key` attribute to uniquely
      identify options. By default, Multiselect passes the `value` property to
      the `key` attribute. However, if `value` is not a primitive, then you must
      specify a different value using the `key` property. In that case, `key`
      should be a function of `value`: for example, if `value` changes, then
      `key` should change.
    - text. The text to show for the option. Defaults to the `value` property.
    - title. A title to render for the option. This can be used to display
      additional text.

  If `options` is `null` (for example, because the list of options is loading),
  then the dropdown will not be shown. The Multiselect component assumes that
  once `options` exists, it will not become `null` again while the dropdown is
  shown.
  */
  options: {
    type: Array,
    required: false
  },
  // props.modelValue is an array of the values of the options that have been
  // selected. The relative order of the values in modelValue may differ from
  // from their relative order in options. The component assumes that modelValue
  // will not change while the dropdown is shown.
  modelValue: {
    type: Array,
    required: true
  },

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
  }
});
const emit = defineEmits(['update:modelValue']);

const optionList = ref(null);



////////////////////////////////////////////////////////////////////////////////
// TRACK SELECTIONS

/*
The component tracks the values of the selected options in `selected`. The
component keeps `selected` and props.modelValue in sync. If props.modelValue
changes, then `selected` is updated. If `selected` changes, then when the
dropdown is hidden, the component will emit an update:modelValue event.

The component also keeps the `checked` property of the checkboxes in sync with
props.options and props.modelValue. If either prop changes, then the `checked`
property will be reset when the dropdown is shown.
*/

// selected.value will be a Set.
const selected = shallowRef(null);
const changeCheckbox = ({ target }) => {
  const option = props.options[target.dataset.index];
  if (target.checked)
    selected.value.add(option.value);
  else
    selected.value.delete(option.value);
};

let needsReset = true;
const resetCheckboxes = () => {
  if (!needsReset) return;
  const checkboxes = optionList.value.querySelectorAll('input');
  for (let i = 0; i < checkboxes.length; i += 1)
    checkboxes[i].checked = selected.value.has(props.options[i].value);
  needsReset = false;
};

// emittedValue holds the last value that has been emitted since
// props.modelValue was last set. It equals `null` if no value has been emitted
// since then, or if no value has ever been emitted. We use emittedValue for an
// optimization in order to avoid an extra sync.
let emittedValue = null;

// This watcher syncs `selected` with props.modelValue and syncs the `checked`
// property of the checkboxes with props.modelValue.
watch(
  () => props.modelValue,
  (modelValue) => {
    if (modelValue !== emittedValue) {
      // We need the set to be reactive, but it needs to be shallow reactive in
      // case a value is an object. In that case, if we used reactive() rather
      // than shallowReactive() (or if we made `selected` a ref rather than a
      // shallow ref), then [...selected.value] would contain a reactive proxy
      // for the value instead of the object.
      selected.value = shallowReactive(new Set(modelValue));
      needsReset = true;
    }
    emittedValue = null;
  },
  { deep: true, immediate: true }
);

// changedSinceSet is `true` if `selected` has changed at any point since
// the last time it was reset to props.modelValue; it is `false` if there has
// been no change. changedSinceSet does not indicate whether `selected`
// currently differs from props.modelValue.
let changedSinceSet = false;
watch(
  selected,
  (newSet, oldSet) => { if (newSet === oldSet) changedSinceSet = true; },
  { deep: true }
);
// This function is used to sync props.modelValue with `selected`.
const emitIfChanged = () => {
  if (!changedSinceSet) return;
  changedSinceSet = false;
  const selectedEqualsModelValue = selected.value.size === props.modelValue.length &&
    props.modelValue.every(value => selected.value.has(value));
  if (!selectedEqualsModelValue) {
    emittedValue = [...selected.value];
    emit('update:modelValue', emittedValue);
  }
};

if (process.env.NODE_ENV === 'development') {
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
const { i18n } = inject('container');
const textToSearch = computed(() => props.options.map(option => {
  const text = option.text != null ? option.text : option.value.toString();
  const result = [text.toLocaleLowerCase(i18n.locale)];
  const { title } = option;
  if (title != null && title !== text)
    result.push(title.toLocaleLowerCase(i18n.locale));
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
  $dropdown.value.on('shown.bs.dropdown', resetCheckboxes);
  $dropdown.value.on('hidden.bs.dropdown', () => {
    searchValue.value = '';
    emitIfChanged();
  });
});
onUnmounted(() => { $dropdown.value.off('.bs.dropdown'); });

const toggle = ref(null);
const toggleId = `multiselect-toggle${id}`;
id += 1;
const $toggle = computed(() => $(toggle.value));
const toggleAfterEnter = ({ key }) => {
  if (key === 'Enter') $toggle.value.dropdown('toggle');
};

if (process.env.NODE_ENV === 'test') {
  const verifyAttached = ({ target }) => {
    if (target.closest('body') == null)
      // eslint-disable-next-line no-console
      console.error('Clicking Multiselect toggle has no effect unless component is attached to body.');
  };
  onMounted(() => { toggle.value.addEventListener('click', verifyAttached); });
  onBeforeUnmount(() => {
    toggle.value.removeEventListener('click', verifyAttached);
  });
}



////////////////////////////////////////////////////////////////////////////////
// SELECT ALL / NONE

const selectAll = () => {
  if (selected.value.size === props.options.length) return;
  if (searchValue.value === '') {
    for (const { value } of props.options) selected.value.add(value);
    for (const checkbox of optionList.value.querySelectorAll('input'))
      checkbox.checked = true;
  } else {
    for (const value of searchMatches) selected.value.add(value);
    const checkboxes = optionList.value.querySelectorAll('.search-match input');
    for (const checkbox of checkboxes) checkbox.checked = true;
  }
};
const selectNone = () => {
  if (selected.value.size === 0) return;
  if (searchValue.value === '') {
    selected.value.clear();
    for (const checkbox of optionList.value.querySelectorAll('input'))
      checkbox.checked = false;
  } else {
    for (const value of searchMatches) selected.value.delete(value);
    const checkboxes = optionList.value.querySelectorAll('.search-match input');
    for (const checkbox of checkboxes) checkbox.checked = false;
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

.multiselect {
  select { min-width: 111px; }

  $line-height: 1;
  .dropdown-menu {
    border-radius: 0;
    line-height: $line-height;
    margin-top: 0;
    padding-bottom: 0;
  }

  $hpadding: 9px;
  $vpadding: 6px;
  .search {
    padding: $vpadding $hpadding;

    // The Multiselect component may be inside a .form-inline.
    .form-group { display: block; }

    .form-control {
      background-color: #fff;
      display: block;
      font-size: $font-size-dropdown-menu;
      height: auto;
      line-height: $line-height;
      // padding-right for the .close button.
      padding: 0 16px 0 0;
      width: 100%;

      &, &:focus { border-bottom: none; }

      &::placeholder {
        color: #666;
        font-style: italic;
      }
    }

    .close {
      font-size: 18px;
      right: 0;
      top: -5px;
    }
  }

  .toggle-all { padding: #{0.5 * $vpadding} $hpadding $vpadding; }

  .option-list {
    background-color: $color-subpanel-background;
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
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      // This text is shown in a dropdown that allows the user to make one or
      // more selections. {all} has the text "All", and {none} has the text
      // "None". {all} and {none} will be translated separately based on what is
      // being selected.
      "select": "Select {all} / {none}"
    }
  }
}
</i18n>
