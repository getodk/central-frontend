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
    :maybe-field-keys="maybeFieldKeys"/>
</template>

<script>
import FieldKey from '../../presenters/field-key';
import MaybeData from '../../maybe-data';
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
      this.maybeProject = MaybeData.awaiting();
      this.maybeFieldKeys = MaybeData.awaiting();
      const headers = { 'X-Extended-Metadata': 'true' };
      this.requestAll([
        this.$http.get(`/projects/${this.projectId}`),
        this.$http.get(`/projects/${this.projectId}/app-users`, { headers })
      ])
        .then(([project, fieldKeys]) => {
          this.maybeProject = MaybeData.success(project.data);
          this.maybeFieldKeys = MaybeData.success(fieldKeys.data
            .map(fieldKey => new FieldKey(fieldKey)));
        })
        .catch(() => {
          this.maybeProject = MaybeData.error();
          this.maybeFieldKeys = MaybeData.error();
        });
    }
  }
};
</script>
