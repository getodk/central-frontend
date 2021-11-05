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
  <tr class="form-row">
    <td class="name">
      <span>{{ form.nameOrId() }}</span>
      <div style="color: red;">deleted at: {{ form._data.deletedAt }}</div>
      <div>{{ form.draftToken !== null ? "draft (should have been immediately purged)" : "" }}</div>
    </td>
    <td v-if="columns.has('idAndVersion')" class="id-and-version">
      <div class="form-id">
        <span :title="form.xmlFormId">{{ form.xmlFormId }}</span>
      </div>
      <div v-if="form.version != null && form.version !== ''" class="version">
        <span :title="form.version">{{ form.version }}</span>
      </div>
    </td>
    <td v-if="columns.has('submissions')" class="submissions">
      <div v-if="form.publishedAt != null">
        <span>{{ $tcn('count.submission', form.submissions) }}</span>
      </div>
      <div v-if="form.lastSubmission != null">
        <router-link :to="submissionsPath">
          <i18n :tag="false" path="lastSubmission">
            <template #dateTime>
              <date-time :iso="form.lastSubmission"/>
            </template>
          </i18n>
        </router-link>
      </div>
    </td>
    <td v-if="columns.has('actions')" class="actions">
        <div class="btn btn-default">Undelete</div>
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
    },
    columns: {
      type: Set,
      required: true
    }
  },
  computed: {
    // The component assumes that this data will exist when the component is
    // created.
    ...requestData(['project']),
    submissionsPath() {
      return this.formPath(
        this.form.projectId,
        this.form.xmlFormId,
        this.form.publishedAt != null ? 'submissions' : 'draft/testing'
      );
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.form-row {
  .table tbody & td { vertical-align: middle; }

  .name {
    .link-if-can { font-size: 24px; }
    a { @include text-link; }

    .icon-angle-right {
      font-size: 20px;
      margin-left: 9px;
    }

    .form-icon {
      font-size: 20px;
      margin-right: 9px;
      cursor: help;
    }

    .form-name-closed {
      color: #999;
    }

    .form-icon-unpublished {
      color: #999;
    }

    .form-icon-closed{
      color: $color-danger;
    }

    .form-icon-closing{
      color: $color-warning;
    }
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
}
</style>

<i18n lang="json5">
{
  "en": {
    // This text shows when the last Submission was received. {dateTime} shows
    // the date and time, for example: "2020/01/01 01:23". It may show a
    // formatted date like "2020/01/01", or it may use a word like "today",
    // "yesterday", or "Sunday".
    "lastSubmission": "(last {dateTime})"
  }
}
</i18n>
