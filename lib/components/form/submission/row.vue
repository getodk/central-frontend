<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <!-- The frozen columns of the table -->
  <tr v-if="questionColumns == null">
    <td>{{ submission.__system.submitterName }}</td>
    <td>{{ submissionDate }}</td>
  </tr>
  <!-- The rest of the table -->
  <tr v-else>
    <td v-for="column of questionColumns" :key="column.key"
      :class="column.htmlClass"
      :title="hasTitle(column) ? questionValue(column) : null">
      <template v-if="column.type === 'binary'">
        <a v-if="questionValue(column) !== ''" :href="questionValue(column)"
          class="form-submissions-binary-link no-text-decoration" target="_blank"
          title="File was submitted. Click to download.">
          <span class="icon-check text-success"></span>
          <span class="icon-download"></span>
        </a>
      </template>
      <template v-else>
        {{ questionValue(column) }}
      </template>
    </td>
    <td>{{ submission.__id.replace(/^uuid:/, '') }}</td>
  </tr>
</template>

<script>
import R from 'ramda';
import { DateTime, Settings } from 'luxon';

import { formatDate } from '../../../util';

const TITLE_QUESTION_TYPES = [
  'string',
  'select',
  'select1',
  'geotrace',
  'geoshape',
  'barcode'
];

export default {
  name: 'FormSubmissionRow',
  props: {
    form: {
      type: Object,
      required: true
    },
    submission: {
      type: Object,
      required: true
    },
    // The question columns to display
    questionColumns: Array // eslint-disable-line vue/require-default-prop
  },
  computed: {
    submissionDate() {
      return formatDate(this.submission.__system.submissionDate);
    }
  },
  methods: {
    // Returns the submission's value for the specified question column,
    // formatting it according to the question's type.
    questionValue(column) {
      const rawValue = R.path(column.path, this.submission);
      if (rawValue == null) return '';
      switch (column.type) {
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

        case 'binary': {
          const encodedInstanceId = encodeURIComponent(this.submission.__id);
          const encodedAttachmentName = encodeURIComponent(rawValue);
          return `/v1/forms/${this.form.encodedId()}/submissions/${encodedInstanceId}/attachments/${encodedAttachmentName}`;
        }

        default:
          return rawValue;
      }
    },
    // Returns true if a value of the specified question column should be
    // displayed with a title attribute and false if not.
    hasTitle(column) {
      return TITLE_QUESTION_TYPES.includes(column.type);
    }
  }
};
</script>
