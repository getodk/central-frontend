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
  <router-view :project-id="projectId" :project="project"
    :field-keys="fieldKeys"/>
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
      project: null,
      fieldKeys: null
    };
  },
  computed: {
    projectId() {
      return parseInt(this.$route.params.projectId, 10);
    }
  },
  watch: {
    projectId() {
      this.fetchData();
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      this.project = null;
      this.fieldKeys = null;
      const headers = { 'X-Extended-Metadata': 'true' };
      this.requestAll([
        this.$http.get(`/projects/${this.projectId}`),
        this.$http.get(`/projects/${this.projectId}/app-users`, { headers })
      ])
        .then(([project, fieldKeys]) => {
          this.project = project.data;
          this.fieldKeys = fieldKeys.data.map(fieldKey => new FieldKey(fieldKey));
        })
        .catch(() => {});
    }
  }
};
</script>
