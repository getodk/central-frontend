<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <label id="date-range-picker-container" class="date-range-picker form-group" :class="{ disabled }">
    <span class="icon-calendar"></span>
    <!-- We use a class to indicate whether the input is required, because
    flatpickr does not support the `required` attribute:
    https://github.com/ankurk91/vue-flatpickr-component/issues/47 -->
    <span class="date-range-picker-label">{{ requiredLabel(label, required) }}</span>
    <span class="display-value" aria-hidden="true">{{ displayValue }}</span>
    <flatpickr id="datepicker" ref="flatpickr" v-model="flatpickrValue" :config="config"
      class="form-control"
      :class="{ required, 'flatpickr-input': true, 'has-value': modelValue.length === 2, none: modelValue.length === 0 }"
      :aria-disabled="disabled" v-tooltip.aria-describedby="disabledMessage"
      :placeholder="placeholder" autocomplete="off"
      @change="setDisplayValue"
      @keydown="stopPropagationIfDisabled"
      @on-close="close"/>
    <template v-if="!required">
      <button v-show="modelValue.length === 2 && !disabled" type="button" class="close"
        :aria-label="$t('action.clear')" @click="clear">
        <span aria-hidden="true">&times;</span>
      </button>
    </template>
    <span v-show="required || modelValue.length < 2" aria-hidden="true" class="icon-angle-down">
    </span>
  </label>
</template>

<script>
import flatpickr from 'flatpickr';
import flatpickrComponent from 'vue-flatpickr-component';
import { DateTime } from 'luxon';
import 'flatpickr/dist/flatpickr.css';

import 'flatpickr/dist/l10n/cs';
import 'flatpickr/dist/l10n/de';
import 'flatpickr/dist/l10n/es';
import 'flatpickr/dist/l10n/fr';
import 'flatpickr/dist/l10n/id';
import 'flatpickr/dist/l10n/it';
import 'flatpickr/dist/l10n/ja';
import 'flatpickr/dist/l10n/pt';
import 'flatpickr/dist/l10n/zh';
import 'flatpickr/dist/l10n/zh-tw';

import { locales } from '../i18n';
import { requiredLabel } from '../util/dom';

// Map locales.
const l10ns = {};
for (const locale of locales.keys()) {
  const l10n = flatpickr.l10ns[locale];
  if (l10n != null) l10ns[locale] = l10n;
}
l10ns['zh-Hant'] = flatpickr.l10ns.zh_tw;

export default {
  name: 'DateRangePicker',
  components: { flatpickr: flatpickrComponent },
  props: {
    // Either an array of two DateTime objects or an empty array
    modelValue: {
      type: Array,
      required: true
    },
    required: {
      type: Boolean,
      default: false
    },
    label: {
      type: String,
      required: true
    },
    // Displayed when no date is selected
    placeholder: {
      type: String,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    },
    disabledMessage: {
      type: String,
      required: false
    }
  },
  emits: ['update:modelValue'],
  setup() {
    return { requiredLabel };
  },
  data() {
    return {
      // We initialize this.flatpickrValue as an array of Date objects, but
      // vue-flatpickr-component will replace it with a string when the user
      // makes a selection.
      flatpickrValue: this.modelValue.map(dateTime => dateTime.toJSDate()),
      displayValue: ''
    };
  },
  computed: {
    config() {
      return {
        mode: 'range',
        // See https://github.com/flatpickr/flatpickr/issues/1549
        dateFormat: 'Y/m/d',
        locale: l10ns[this.$i18n.locale] ?? l10ns[this.$i18n.fallbackLocale],
        clickOpens: !this.disabled
      };
    }
  },
  watch: {
    modelValue(value) {
      this.flatpickrValue = value.map(dateTime => dateTime.toJSDate());
    },
  },
  mounted() {
    this.setDisplayValue();
  },
  methods: {
    // Converts an array of Date objects from a selection to an array of
    // DateTime objects. If the selection was incomplete -- if fewer dates were
    // selected than expected -- then default values will be used for one or
    // both DateTime objects. Returns the DateTime objects along with an
    // indicator of whether the selection was complete.
    selectedDatesToDateTimes(dates) {
      // dates.length === 0 if the user opens the calendar, clears the selection
      // (for example, by pressing backspace), then closes the calendar. (There
      // doesn't seem to be an easy way to turn off this behavior for if
      // this.required is `true`.)
      if (dates.length === 0) {
        if (!this.required) return [dates, true];
        const today = DateTime.local().startOf('day');
        return [[today, today], false];
      }
      // dates.length === 1 if the user opens the calendar, selects a date, then
      // closes the calendar without selecting a second date.
      if (dates.length === 1) {
        const dateTime = DateTime.fromJSDate(dates[0]);
        return [[dateTime, dateTime], false];
      }
      return [dates.map(DateTime.fromJSDate), true];
    },
    close(selectedDates) {
      const [newValue, complete] = this.selectedDatesToDateTimes(selectedDates);
      const newEqualsOld = newValue.length === 0
        ? this.modelValue.length === 0
        : this.modelValue.length === 2 &&
          newValue[0].valueOf() === this.modelValue[0].valueOf() &&
          newValue[1].valueOf() === this.modelValue[1].valueOf();
      if (!newEqualsOld) {
        this.$emit('update:modelValue', newValue);
      } else if (!complete) {
        // newValue represents a complete selection. That means that since the
        // actual selection was incomplete, it does not match newValue. Because
        // of that, even though this.modelValue will not change, we still need
        // to set this.flatpickrValue.
        this.flatpickrValue = newValue.map(dateTime => dateTime.toJSDate());
      }
    },
    clear() {
      this.$emit('update:modelValue', []);

      // The .close button will be hidden, so we focus the flatpickr input.
      // Focusing it will open the calendar, which we don't want, so we
      // immediately close the calendar using the approach described here:
      // https://github.com/ankurk91/vue-flatpickr-component/issues/33
      this.$refs.flatpickr.$el.focus();
      this.$refs.flatpickr.fp.close();
    },
    stopPropagationIfDisabled(e) {
      if (this.disabled) {
        e.stopPropagation();
      }
    },
    setDisplayValue() {
      const controlValue = this.$refs.flatpickr?.$el.value;
      this.displayValue = controlValue || this.placeholder;
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/mixins';
@import '../assets/scss/variables';

// The flatpickr input is readonly by default, but we do not want to style it as
// readonly.
.form-group .flatpickr-input[readonly] {
  color: $color-input;

  &::placeholder { color: $color-text; }
}

.form-group .flatpickr-input[aria-disabled="true"]::placeholder {
  color: $color-input-inactive;
}

.form-inline .flatpickr-input {
  width: 87px;

  &.has-value {
    // Leave space for the .close button.
    width: 207px;
    &.required { width: 193px };
  }

  &.has-value:lang(ja) {
    width: 252px;
    &.required { width: 240px; }
  }

  &.none {
    font-style: italic;
  }
}

#date-range-picker-container {
  @include filter-control;


  &.disabled {
    cursor: not-allowed;
  }
  .icon-angle-down {
    font-size: 16px;
    color: #555555;
    font-weight: bold;
    vertical-align: -4px;
  }

  // hide the flatpickr because we can't its width to fit-content
  .form-control {
    position: absolute;
    opacity: 0;
  }

  .close {
    position: static;
    transform: translateY(-2px);
  }
}
</style>
