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
    <tr class="form-trash-row">
      <td class="name">
        <span class="form-name">{{ form.nameOrId() }}</span>
        <div class="deleted-date">{{ $t('deleted') }} <date-time :iso="form._data.deletedAt"/></div>
      </td>
      <td class="id-and-version">
        <div class="form-id">
          <span :title="form.xmlFormId">{{ form.xmlFormId }}</span>
        </div>
        <div v-if="form.version != null && form.version !== ''" class="version">
          <span :title="form.version">{{ form.version }}</span>
        </div>
      </td>
      <td class="submissions">
        <div v-if="form.publishedAt != null">
          <span>{{ $tcn('count.submission', form.submissions) }}</span>
        </div>
        <div v-if="form.lastSubmission != null">
            <i18n :tag="false" path="lastSubmission">
              <template #dateTime>
                <date-time :iso="form.lastSubmission"/>
              </template>
            </i18n>
        </div>
      </td>
      <td class="actions">
        <button id="form-trash-row-restore-button" type="button" class="btn btn-default"
          @click="openRestoreModal(form)">
          <span class="icon-refresh"></span>{{ $t('undelete') }}
        </button>
      </td>
    </tr>
</template>

<script>
import DateTime from '../date-time.vue';
import Form from '../../presenters/form';
import routes from '../../mixins/routes';
import { requestData } from '../../store/modules/request';

export default {
  name: 'DeletedFormRow',
  components: { DateTime },
  mixins: [routes()],
  props: {
    form: {
      type: Form,
      required: true
    }
  },
  computed: {
    // The component assumes that this data will exist when the component is
    // created.
    ...requestData(['project'])
  },
  methods: {
    openRestoreModal(form) {
      this.$emit('start-restore', form);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.form-trash-row {
  .table tbody & td { vertical-align: middle; }

  // column widths
  .name {
    width: 500px;
    max-width: 500px;
    @include text-overflow-ellipsis;
  }

  .id-and-version {
    width: 180px;
    max-width: 180px;
  }

  .submissions {
    width: 180px;
    max-width: 180px;
  }

  .actions {
    width: 180px;
    max-width: 180px;
  }

  .form-name {
    font-size: 20px;
  }

  .form-id, .version {
    @include text-overflow-ellipsis;
    font-family: $font-family-monospace;
  }

  .version { color: #888; }

  .submissions {
    a { @include text-link; }
    .icon-angle-right { margin-left: 6px; }
  }

  .deleted-date {
    color: $color-danger;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text shows when the last Submission was received. {dateTime} shows
    // the date and time, for example: "2020/01/01 01:23". It may show a
    // formatted date like "2020/01/01", or it may use a word like "today",
    // "yesterday", or "Sunday".
    "lastSubmission": "(last {dateTime})",
    "deleted": "Deleted",
    "undelete": "Undelete"
  }
}
</i18n>
