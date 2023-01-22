<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<template>
  <table v-if="properties.length > 0" id="dataset-properties" class="table">
    <thead>
      <tr>
        <th>{{ $t('header.name') }}</th>
        <th>{{ $t('header.updatedBy') }}</th>
      </tr>
    </thead>
    <tbody>
      <template v-for="(property) in properties" :key="property.name">
        <tr>
          <!-- we have to show property name even if there is no associated form -->
          <td :rowspan="property.forms.length || 1">
            {{ property.name }}
          </td>
          <td>
            <router-link v-if="property.forms.length > 0" :to="publishedFormPath(projectId, property.forms[0].xmlFormId)" v-tooltip.text>
              {{ property.forms[0].name }}
            </router-link>
          </td>
        </tr>
        <template v-for="(form, index) in property.forms" :key="form.xmlFormId">
          <tr v-if="index > 0">
            <td>
              <router-link :to="publishedFormPath(projectId, form.xmlFormId)" v-tooltip.text>{{ form.name }}</router-link>
            </td>
          </tr>
        </template>
      </template>
    </tbody>
  </table>
  <p v-show="properties.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>
</template>

<script>
import routes from '../../../mixins/routes';

export default {
  name: 'DatasetProperties',
  mixins: [routes()],
  props: {
    properties: {
      type: Array,
      required: true
    },
    projectId: {
      type: String,
      required: true
    }
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';

#dataset-properties {
  td {
    @include text-overflow-ellipsis;
  }

  &.table > tbody > tr:first-child > td {
    border-top: none;
  }

  a {
    font-size: 16px;
  }
}
</style>

<i18n lang="json5">
  {
    "en": {
      "emptyTable": "There are no Properties in this Dataset."
    }
  }
  </i18n>
