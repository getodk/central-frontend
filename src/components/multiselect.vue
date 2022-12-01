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
      <li class="change-all">
        <i18n-t tag="div" keypath="action.select">
          <template #all>
            <a class="select-all" href="#" role="button" @click.prevent="changeAll(true)">{{ all }}</a>
          </template>
          <template #none>
            <a class="select-none" href="#" role="button" @click.prevent="changeAll(false)">{{ none }}</a>
          </template>
        </i18n-t>
      </li>
      <li>
        <ul ref="optionList" class="option-list"
          :class="{ 'shows-all': searchValue === '' }" @change="changeCheckbox">
          <template v-if="options != null">
            <!-- eslint-disable-next-line vue/object-curly-newline -->
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
      <li class="after-list">
        <slot name="after-list" :selected="selected"></slot>
      </li>
    </ul>
  </div>
</template>

<script>
let id = 1;
</script>
<script setup>
import { computed, inject, onBeforeUnmount, onMounted, onUnmounted, ref, shallowReactive, watch, watchEffect } from 'vue';

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
    - title. The title to show for the option. This property can be used to
      display additional text. Defaults to the `text` property.

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
const changes = new Set();
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

// emittedValue holds the last value that has been emitted since
// props.modelValue was last set. It equals `null` if no value has been emitted
// since then, or if no value has ever been emitted. We use emittedValue for an
// optimization in order to avoid an extra sync.
let emittedValue = null;
const emitIfChanged = () => {
  if (changes.size === 0) return;
  changes.clear();
  emittedValue = [...selected];
  emit('update:modelValue', emittedValue);
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
  $dropdown.value.on('shown.bs.dropdown', syncWithModelValue);
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

  .change-all { padding: #{0.5 * $vpadding} $hpadding $vpadding; }

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
