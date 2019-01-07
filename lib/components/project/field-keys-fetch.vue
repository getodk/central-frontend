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
  <div v-show="false"></div>
</template>

<script>
import FieldKey from '../../presenters/field-key';
import MaybeData from '../../maybe-data';
import request from '../../mixins/request';

export default {
  name: 'ProjectFieldKeysFetch',
  mixins: [request()],
  props: {
    projectId: {
      type: String,
      required: true
    },
    requestCounter: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      requestId: null
    };
  },
  watch: {
    requestCounter() {
      this.fetchData();
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      const headers = { 'X-Extended-Metadata': 'true' };
      this.get(`/projects/${this.projectId}/app-users`, { headers })
        .then(({ data }) => {
          const fieldKeys = data.map(fieldKey => new FieldKey(fieldKey));
          this.$emit('complete', MaybeData.success(fieldKeys));
        })
        .catch(() => {
          this.$emit('complete', MaybeData.error());
        });
    }
  }
};
</script>
