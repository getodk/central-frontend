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
  <label class="form-group"><!-- eslint-disable-line vuejs-accessibility/label-has-for -->
    <!-- We use a class to indicate whether the input is required, because
    flatpickr does not support the `required` attribute:
    https://github.com/ankurk91/vue-flatpickr-component/issues/47 -->
    <flatpickr ref="flatpickr" v-model="flatpickrValue" :config="config"
      class="form-control" :class="{ required }"
      :placeholder="`${placeholder}${star}`" autocomplete="off"
      @on-close="close"/>
    <template v-if="!required">
      <button v-show="modelValue.length === 2" type="button" class="close"
        :aria-label="$t('action.clear')" @click="clear">
        <span aria-hidden="true">&times;</span>
      </button>
    </template>
    <span class="form-label">{{ placeholder }}{{ star }}</span>
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
    placeholder: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue'],
  data() {
    return {
      // We initialize this.flatpickrValue as an array of Date objects, but
      // vue-flatpickr-component will replace it with a string when the user
      // makes a selection.
      flatpickrValue: this.modelValue.map(dateTime => dateTime.toJSDate())
    };
  },
  computed: {
    config() {
      const config = {
        mode: 'range',
        // See https://github.com/flatpickr/flatpickr/issues/1549
        dateFormat: 'Y/m/d'
      };
      const l10n = flatpickr.l10ns[this.$i18n.locale];
      if (l10n != null) config.locale = l10n;
      return config;
    },
    star() {
      return this.required ? '*' : '';
    }
  },
  watch: {
    modelValue(value) {
      this.flatpickrValue = value.map(dateTime => dateTime.toJSDate());
    }
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
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/variables';

// The flatpickr input is readonly by default, but we do not want to style it as
// readonly.
.form-group .flatpickr-input[readonly] {
  color: $color-input;

  &::placeholder { color: $color-text; }
}

.form-inline .flatpickr-input {
  // Leave space for the .close button.
  width: 205px;
  &.required { width: 193px };

  &:lang(ja) {
    width: 252px;
    &.required { width: 240px; }
  }
}
</style>
