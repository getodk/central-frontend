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
  <div class="form-group">
    <flat-pickr v-model="flatpickrValue" :config="config" class="form-control"
      :placeholder="placeholder" :aria-label="placeholder" @on-close="close"/>
  </div>
</template>

<script>
import flatPickr from 'vue-flatpickr-component';
import { DateTime } from 'luxon';
import 'flatpickr/dist/flatpickr.css';

import { flatpickrLocales } from '../util/i18n';

export default {
  name: 'DateRangePicker',
  components: { flatPickr },
  props: {
    // An array of two DateTime objects
    value: {
      type: Array,
      required: true
    },
    placeholder: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // We initialize flatpickrValue as an array of Date objects, but
      // vue-flatpickr-component will replace it with a string when the user
      // makes a selection.
      flatpickrValue: this.value.map(dateTime => dateTime.toJSDate())
    };
  },
  computed: {
    flatpickrLocale() {
      // flatpickr bundles the flatpickr locale for en.
      if (this.$i18n.locale === 'en') return null;
      if (this.$i18n.locale === this.$i18n.fallbackLocale) {
        // DateRangePicker does not currently bundle the flatpickr locale for
        // the i18n fallback locale, because the i18n fallback locale is en, and
        // flatpickr itself bundles the flatpickr locale for en.
        throw new Error('DateRangePicker must bundle the flatpickr locale for the i18n fallback locale');
      }
      return flatpickrLocales[this.$i18n.locale];
    },
    config() {
      const config = {
        mode: 'range',
        // See https://github.com/flatpickr/flatpickr/issues/1549
        dateFormat: 'Y/m/d'
      };
      // If this.$i18n.locale changes, this.config will change, but flatpickr
      // itself won't change:
      // https://github.com/flatpickr/flatpickr/issues/1882
      // https://github.com/flatpickr/flatpickr/issues/2019
      if (this.flatpickrLocale != null) config.locale = this.flatpickrLocale;
      return config;
    }
  },
  watch: {
    value(value) {
      this.flatpickrValue = value.map(dateTime => dateTime.toJSDate());
    }
  },
  methods: {
    selectedDatesToDateTimes(dates) {
      // dates.length === 0 if the user opens the calendar, clears the selection
      // (for example, by pressing backspace), then closes the calendar. (There
      // doesn't seem to be an easy way to turn off this behavior.)
      if (dates.length === 0) {
        const today = DateTime.local().startOf('day');
        return [today, today];
      }
      // dates.length === 1 if the user opens the calendar, selects a date, then
      // closes the calendar without selecting a second date -- in other words,
      // if the user makes an incomplete selection of a single date.
      if (dates.length === 1) {
        const dateTime = DateTime.fromJSDate(dates[0]);
        return [dateTime, dateTime];
      }
      return dates.map(DateTime.fromJSDate);
    },
    close(selectedDates) {
      const newValue = this.selectedDatesToDateTimes(selectedDates);
      if (newValue[0].valueOf() !== this.value[0].valueOf() ||
        newValue[1].valueOf() !== this.value[1].valueOf())
        this.$emit('input', newValue);
      // newValue represents a complete date range selection. However, if
      // selectedDates.length < 2, the actual selection is incomplete and
      // therefore does not match newValue. In that case, even if this.value
      // will not change, we need to set this.flatpickrValue.
      else if (selectedDates.length < 2)
        this.flatpickrValue = newValue.map(dateTime => dateTime.toJSDate());
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

  &::placeholder {
    color: $color-text;
  }
}

.form-inline .flatpickr-input {
  width: 192px;
}
</style>
