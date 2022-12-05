<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <tr :class="htmlClass">
    <template v-if="submission.__system.status == null">
      <td v-for="field of fields" :key="field.path" :class="fieldClass(field)"
        :title="field.binary !== true ? formattedValue(submission, field) : null">
        <template v-if="field.binary === true">
          <!-- eslint-disable-next-line vuejs-accessibility/anchor-has-content -->
          <a v-if="rawValue(submission, field) != null" class="binary-link"
            :href="formattedValue(submission, field)" target="_blank"
            :title="$t('submission.binaryLinkTitle')">
            <span class="icon-check"></span> <span class="icon-download"></span>
          </a>
        </template>
        <template v-else>{{ formattedValue(submission, field) }}</template>
      </td>
    </template>
    <template v-else-if="fields.length !== 0">
      <td class="encrypted-data" :colspan="fields.length">
        <span class="icon-lock"></span>
        <span class="encryption-message">{{ $t('submission.encryptionMessage') }}</span>
        <span class="encryption-overlay"></span>
      </td>
    </template>
    <td :title="submission.__id">{{ submission.__id }}</td>
  </tr>
</template>

<script>
import { DateTime, Settings } from 'luxon';
import { path } from 'ramda';

import { apiPaths } from '../../util/request';
import { formatDate, formatDateTime, formatTime } from '../../util/date-time';

/*
We may render many rows and/or many columns, so performance matters in this
component. SubmissionDataRow components may be frequently created or unmounted,
so it matters how long it takes to render a component and how long it takes to
unmount one. (Note that unmounting may take longer than rendering!)

We used to have a SubmissionCell component, but that was too slow: now
everything is done in this component. We also used to have an i18n custom block,
but that again was significantly slower.
*/

export default {
  name: 'SubmissionDataRow',
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    draft: Boolean,
    submission: {
      type: Object,
      required: true
    },
    fields: {
      type: Array,
      required: true
    }
  },
  computed: {
    htmlClass() {
      return {
        'encrypted-submission': this.submission.__system.status != null
      };
    }
  },
  methods: {
    fieldClass(field) {
      if (field.binary === true) return 'binary-field';
      if (field.type === 'int') return 'int-field';
      if (field.type === 'decimal') return 'decimal-field';
      if (field.type === 'geopoint') return 'geopoint-field';
      return null;
    },
    rawValue(submission, field) {
      return path(field.pathElements, submission);
    },
    formattedValue(submission, field) {
      const rawValue = this.rawValue(submission, field);
      if (rawValue == null) return null;
      // A field could have a `binary` property that is `true` but a `type`
      // property that does not equal 'binary'. Backend treats the `binary`
      // property as authoritative.
      if (field.binary === true) {
        return apiPaths.submissionAttachment(
          this.projectId,
          this.xmlFormId,
          this.draft,
          this.submission.__id,
          rawValue
        );
      }
      switch (field.type) {
        case 'int':
          return this.$n(rawValue, 'default');
        // The ODK XForms specification seems to allow decimal values that
        // cannot be precisely stored as a Number. However, Collect limits
        // decimal input to 15 characters, resulting in only values that can be
        // precisely stored as a Number.
        case 'decimal': {
          if (Number.isInteger(rawValue)) return this.$n(rawValue, 'default');
          // Non-integers outside this range are more than 15 characters
          // (including the sign and decimal point).
          if (rawValue >= 10000000000000 || rawValue <= -1000000000000)
            return this.$n(rawValue, 'maximumFractionDigits1');
          const integerDigits = Math.floor(Math.abs(rawValue)).toString().length;
          const signCharacters = rawValue < 0 ? 1 : 0;
          // 14, not 15, because the decimal point consumes a character.
          const fractionDigits = 14 - integerDigits - signCharacters;
          return this.$n(rawValue, `maximumFractionDigits${fractionDigits}`);
        }

        // There may be differences between ISO 8601 and the the ODK XForms
        // specification for date or time values, but the values that Collect
        // sends seem to be ISO 8601. Here, we attempt to parse a date or time
        // value as ISO 8601, but if the resulting DateTime is invalid, we
        // indicate that to the user.
        case 'date':
          return formatDate(DateTime.fromISO(rawValue));
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
          return formatTime(time);
        }
        // rawValue is an Edm.DateTimeOffset. Again, there may be differences
        // between ISO 8601 and the Edm.DateTimeOffset specification. However,
        // ISO 8601 is the only likely format for rawValue. As with a date or
        // time value, we attempt to parse a dateTime value as ISO 8601,
        // indicating any failure to the user.
        case 'dateTime':
          return formatDateTime(DateTime.fromISO(rawValue));

        default:
          return rawValue;
      }
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-table-data {
  .int-field, .decimal-field { text-align: right; }
  .geopoint-field { max-width: 500px; }

  .binary-field { text-align: center; }
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
    &:hover .icon-download { color: $color-action-foreground; }
  }

  .encrypted-submission {
    $icon-lock-margin-left: 3px;
    $icon-lock-margin-right: 12px;
    .icon-lock {
      font-size: 16px;
      color: #666;
      margin-left: $icon-lock-margin-left;
      margin-right: $icon-lock-margin-right;
      vertical-align: -2px;
    }

    .encryption-message { font-style: italic; }

    ~ .encrypted-submission {
      .encrypted-data { position: relative; }
      .encryption-message { display: none; }

      .encryption-overlay {
        background-color: #ddd;
        display: inline-block;
        height: 12px;
        position: absolute;
        // Adding 4px in order to vertically center the overlay.
        top: $padding-top-table-data + 4px;
        // 12px is the width of the .icon-lock (plus a pixel or two for good
        // measure).
        width: calc(100% - #{$padding-left-table-data + $icon-lock-margin-left} -
          12px - #{$icon-lock-margin-right + $padding-right-table-data});
      }
    }
  }
}
</style>
