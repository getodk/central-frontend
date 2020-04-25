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
  <td :class="htmlClass" :title="title">
    <template v-if="column.binary === true">
      <a v-if="formattedValue !== ''" class="binary-link" :href="formattedValue"
        target="_blank" title="File was submitted. Click to download.">
        <span class="icon-check"></span> <span class="icon-download"></span>
      </a>
    </template>
    <template v-else>
      {{ formattedValue }}
    </template>
  </td>
</template>

<script>
import { DateTime, Settings } from 'luxon';
import { path } from 'ramda';

const typeOptions = {
  barcode: { title: true },
  decimal: { htmlClass: true },
  geoshape: { title: true },
  geotrace: { title: true },
  int: { htmlClass: true },
  select: { title: true },
  select1: { title: true },
  string: { title: true }
};

export default {
  name: 'SubmissionCell',
  props: {
    baseUrl: {
      type: String,
      required: true
    },
    submission: {
      type: Object,
      required: true
    },
    column: {
      type: Object,
      required: true
    }
  },
  computed: {
    htmlClass() {
      const htmlClass = ['submission-table-field'];
      if (this.column.binary === true) htmlClass.push('submission-cell-binary');
      const { type } = this.column;
      if (type != null) {
        const options = typeOptions[type];
        if (options != null && options.htmlClass === true)
          htmlClass.push(`submission-cell-${type}`);
      }
      return htmlClass;
    },
    formattedValue() {
      const rawValue = path(this.column.pathComponents, this.submission);
      if (rawValue == null) return '';
      // A field could have a `binary` property that is `true` but a `type`
      // property that does not equal 'binary'. Backend treats the `binary`
      // property as authoritative.
      if (this.column.binary === true) {
        const encodedId = encodeURIComponent(this.submission.__id);
        const encodedName = encodeURIComponent(rawValue);
        return `${this.baseUrl}/submissions/${encodedId}/attachments/${encodedName}`;
      }
      switch (this.column.type) {
        case 'int':
          return rawValue.toLocaleString();
        // The ODK XForms specification seems to allow decimal values that
        // cannot be precisely stored as a Number. However, Collect limits
        // decimal input to 15 characters, resulting in only values that can be
        // precisely stored as a Number.
        case 'decimal': {
          if (Number.isInteger(rawValue)) return rawValue.toLocaleString();
          // Math.log() might be more performant?
          const integerDigits = Math.floor(Math.abs(rawValue)).toString().length;
          const signCharacters = rawValue < 0 ? 1 : 0;
          // 14, not 15, because the decimal point consumes a character. Using
          // Math.max() just to be safe.
          const maximumFractionDigits = Math.max(14 - integerDigits - signCharacters, 0);
          return rawValue.toLocaleString(undefined, { maximumFractionDigits });
        }

        // There may be differences between ISO 8601 and the the ODK XForms
        // specification for date or time values, but the values that Collect
        // sends seem to be ISO 8601. Here, we attempt to parse a date or time
        // value as ISO 8601, but if the resulting DateTime is invalid, we
        // indicate that to the user.
        case 'date':
          return DateTime.fromISO(rawValue).toFormat('yyyy/MM/dd');
        case 'time': {
          /* Collect does not allow the user to select a time value's associated
          time zone. However, Collect may add a time zone designator to the
          value nonetheless. In that case, we will remove the time zone
          designator before displaying the value in the table. By default,
          DateTime.fromISO() returns a local DateTime. However, if the system
          date is the date of a DST shift, rawValue may imply an invalid or
          ambiguous time: since rawValue includes a time but not a date,
          DateTime will use the system date. To avoid that, we temporarily set
          the default time zone to UTC. */
          const originalZoneName = Settings.defaultZoneName;
          Settings.defaultZoneName = 'utc';
          const time = DateTime.fromISO(rawValue, { setZone: true });
          Settings.defaultZoneName = originalZoneName;
          return time.toFormat('HH:mm:ss');
        }
        // rawValue is an Edm.DateTimeOffset. Again, there may be differences
        // between ISO 8601 and the Edm.DateTimeOffset specification. However,
        // ISO 8601 is the only likely format for rawValue. As with a date or
        // time value, we attempt to parse a dateTime value as ISO 8601,
        // indicating any failure to the user.
        case 'dateTime':
          return DateTime.fromISO(rawValue).toFormat('yyyy/MM/dd HH:mm:ss');

        case 'geopoint':
          return rawValue
            .coordinates
            .map((coordinate, i) => {
              // Limiting the number of decimal places helps ensure that the
              // formatted value fits within the column width. For longitude and
              // latitude, 7 decimal places provide precision of 0.011m at the
              // equator.
              const digits = i < 2 ? 7 : 1;
              return coordinate.toLocaleString(undefined, {
                minimumFractionDigits: digits,
                maximumFractionDigits: digits
              });
            })
            .join(' ');

        default:
          return rawValue;
      }
    },
    title() {
      if (this.column.binary === true || this.formattedValue === '')
        return null;
      const { type } = this.column;
      if (type == null) return null;
      const options = typeOptions[type];
      return options != null && options.title === true
        ? this.formattedValue
        : null;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-table2 td {
  &.submission-cell-int, &.submission-cell-decimal {
    text-align: right;
  }

  &.submission-cell-binary {
    text-align: center;
  }

  .binary-link {
    background-color: $color-subpanel-background;
    border-radius: 99px;
    padding: 4px 7px;
    text-decoration: none;

    .icon-check {
      color: $color-success;
      margin-right: 0;
    }

    .icon-download {
      border-left: 1px dotted #ccc;
      color: #bbb;
      padding-left: 5px;
    }

    &:hover .icon-download {
      color: $color-action-foreground;
    }
  }
}
</style>
