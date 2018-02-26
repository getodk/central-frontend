<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <alert v-bind="alert" @close="alert.state = false"/>
    <float-row>
      <button type="button" class="btn btn-primary" @click="newFieldKey.state = true">
        <span class="icon-plus-circle"></span> Create Field Key
      </button>
    </float-row>
    <loading v-if="fieldKeys == null" :state="awaitingResponse"/>
    <p v-else-if="fieldKeys.length === 0">
      There are no field keys yet. You will need to create some to download
      forms and submit data from your device.
    </p>
    <table v-else id="field-key-list-table" class="table table-hover">
      <thead>
        <tr>
          <th>Nickname</th>
          <th>Created</th>
          <th>Last Used</th>
          <th>Auto-Configure</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="fieldKey of fieldKeys" :key="fieldKey.id"
          :class="highlight(fieldKey, 'id')">
          <td>{{ fieldKey.displayName }}</td>
          <td>{{ created(fieldKey) }}</td>
          <td>{{ lastUsed(fieldKey) }}</td>
          <td>???</td>
        </tr>
      </tbody>
    </table>

    <field-key-new v-bind="newFieldKey" @hide="newFieldKey.state = false"
      @success="afterCreate"/>
  </div>
</template>

<script>
import moment from 'moment';

import FieldKeyNew from './new.vue';
import alert from '../../mixins/alert';
import highlight from '../../mixins/highlight';
import request from '../../mixins/request';

export default {
  name: 'FieldKeyList',
  components: { FieldKeyNew },
  mixins: [alert(), request(), highlight()],
  data() {
    return {
      alert: alert.blank(),
      requestId: null,
      fieldKeys: null,
      highlighted: null,
      newFieldKey: {
        state: false
      }
    };
  },
  watch: {
    alert() {
      this.$emit('alert');
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.fieldKeys = null;
      const headers = { 'X-Extended-Metadata': 'true' };
      this
        .get('/field-keys', { headers })
        .then(fieldKeys => {
          this.fieldKeys = fieldKeys;
        })
        .catch(() => {});
    },
    created(fieldKey) {
      const createdAt = moment(fieldKey.createdAt).fromNow();
      const createdBy = fieldKey.createdBy.displayName;
      return `${createdAt} by ${createdBy}`;
    },
    lastUsed(fieldKey) {
      return fieldKey.lastUsed != null ? moment(fieldKey.lastUsed).fromNow() : '';
    },
    afterCreate(fieldKey) {
      this.fetchData();
      this.alert = alert.success(`The field key “${fieldKey.displayName}” was created successfully.`);
      this.highlighted = fieldKey.id;
    }
  }
};
</script>

<style lang="sass">
#field-key-list-table tbody td {
  vertical-align: middle;
}
</style>
