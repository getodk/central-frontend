<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <form id="audit-filters" class="form-inline" @submit.prevent>
    <span class="icon-filter"></span><span>{{ $t('filter') }}</span>
    <div class="form-group">
      <select v-model="action" class="form-control"
        :aria-label="$t('field.type')">
        <option v-for="option of actionOptions" :key="option.value"
          :class="{ 'action-category': option.category }" :value="option.value">
          {{ option.text }}
        </option>
      </select>
    </div>
    <div class="form-group">
      <flat-pickr v-model="dateRangeString" :config="flatPickrConfig"
        class="form-control" :placeholder="$t('field.dateRange')"
        :aria-label="$t('field.dateRange')" @on-close="closeCalendar"/>
    </div>
  </form>
</template>

<script>
import flatPickr from 'vue-flatpickr-component';
import { DateTime } from 'luxon';

import i18n from '../../i18n';
import { auditActionMessage } from '../../util/i18n';
import { flatPickrConfig, formatDate } from '../../util/date-time';

const categoryOption = (category) => ({
  text: i18n.t(`audit.category.${category}`),
  value: category,
  category: true
});
const actionOption = (action) => ({
  // Adding non-breaking spaces: see #323 on GitHub.
  text: `\u00a0\u00a0\u00a0${auditActionMessage(action)}`,
  value: action,
  category: false
});
const actionOptions = [
  categoryOption('nonverbose'),
  categoryOption('user'),
  actionOption('user.create'),
  actionOption('user.update'),
  actionOption('assignment.create'),
  actionOption('assignment.delete'),
  actionOption('user.delete'),
  categoryOption('project'),
  actionOption('project.create'),
  actionOption('project.update'),
  actionOption('project.delete'),
  categoryOption('form'),
  actionOption('form.create'),
  actionOption('form.update'),
  actionOption('form.update.draft.set'),
  actionOption('form.update.publish'),
  actionOption('form.update.draft.delete'),
  actionOption('form.attachment.update'),
  actionOption('form.delete')
];

export default {
  name: 'AuditFilters',
  components: { flatPickr },
  props: {
    initial: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      action: this.initial.action,
      // An array of two DateTime objects
      dateRange: this.initial.dateRange,
      dateRangeString: this.dateRangeToString(this.initial.dateRange)
    };
  },
  computed: {
    actionOptions() {
      return actionOptions;
    },
    flatPickrConfig() {
      return flatPickrConfig.range;
    }
  },
  watch: {
    action: 'filter'
  },
  methods: {
    dateRangeToString(dateRange) {
      const start = formatDate(dateRange[0]);
      const end = formatDate(dateRange[1]);
      // If start === end, then when we set this.dateRangeString to the
      // following string, vue-flatpickr-component will set this.dateRangeString
      // to `start`. However, we cannot set this.dateRangeString to `start`
      // ourselves: if we did, vue-flatpickr-component would treat the selection
      // as incomplete until the user selected an additional date.
      return `${start} to ${end}`;
    },
    filter() {
      this.$emit('filter', { action: this.action, dateRange: this.dateRange });
    },
    datesToDateRange(dates) {
      // dates.length === 0 if the user opens the calendar, clears the date
      // range (for example, by pressing backspace), then closes the calendar.
      // (There doesn't seem to be an easy way to turn off this behavior.)
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
      return dates.map(date => DateTime.fromJSDate(date));
    },
    closeCalendar(dates) {
      const dateRange = this.datesToDateRange(dates);
      if (dateRange[0].valueOf() !== this.dateRange[0].valueOf() ||
        dateRange[1].valueOf() !== this.dateRange[1].valueOf()) {
        this.dateRange = dateRange;
        this.filter();
      }

      // If dates.length < 2, the date range selection is incomplete and
      // therefore does not match this.dateRange. Thus, regardless of whether
      // this.dateRange has changed, we need to set this.dateRangeString.
      // (Also, interestingly, the value of the flatpickr input element seems to
      // become empty even when dates.length === 1.)
      if (dates.length < 2)
        this.dateRangeString = this.dateRangeToString(dateRange);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#audit-filters {
  .icon-filter {
    color: #999;
    margin-right: 6px;
  }

  .form-group {
    margin-left: 12px;
    // Align the .form-group elements with the text to their left.
    vertical-align: baseline;
  }

  .form-group + .form-group {
    margin-left: 21px;
  }

  .action-category {
    // Not all browsers support styling an <option> element this way.
    font-weight: bold;
  }

  .flatpickr-input {
    width: $width-flatpickr-range-input;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text is shown next to options for filtering a table.
    "filter": "Filter by"
  }
}
</i18n>
