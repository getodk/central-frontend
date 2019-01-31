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
  <router-view :project-id="projectId" :maybe-project="maybeProject"
    :maybe-field-keys="maybeFieldKeys" @refresh-field-keys="fetchFieldKeys"/>
</template>

<script>
import FieldKey from '../../presenters/field-key';
import request from '../../mixins/request';

export default {
  name: 'ProjectHome',
  mixins: [request()],
  data() {
    return {
      requestId: null,
      maybeProject: null,
      maybeFieldKeys: null
    };
  },
  computed: {
    projectId() {
      return this.$route.params.projectId;
    },
    maybeGetFieldKeysOptions() {
      return {
        url: `/projects/${this.projectId}/app-users`,
        extended: true,
        transform: (data) => data.map(fieldKey => new FieldKey(fieldKey))
      };
    }
  },
  watch: {
    projectId() {
      this.fetchProjectAndFieldKeys();
    }
  },
  created() {
    this.fetchProjectAndFieldKeys();
  },
  methods: {
    fetchProjectAndFieldKeys() {
      this.maybeGet({
        maybeProject: {
          url: `/projects/${this.projectId}`
        },
        maybeFieldKeys: this.maybeGetFieldKeysOptions
      });
    },
    fetchFieldKeys() {
      // If there has not been a response yet to the request for the project,
      // this request will effectively cancel that request. That means that this
      // method should only be called once the project response has been
      // received.
      this.maybeGet({ maybeFieldKeys: this.maybeGetFieldKeysOptions });
    }
  }
};
</script>
