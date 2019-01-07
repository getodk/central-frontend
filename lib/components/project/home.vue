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
  <div>
    <!-- This is pretty ugly -- is there another pattern we can use? -->
    <project-field-keys-fetch :project-id="projectId"
      :request-counter="fieldKeysRequestCounter" @complete="setMaybeFieldKeys"/>
    <router-view :project-id="projectId" :maybe-project="maybeProject"
      :maybe-field-keys="maybeFieldKeys" @refresh-field-keys="fetchFieldKeys"/>
  </div>
</template>

<script>
import MaybeData from '../../maybe-data';
import ProjectFieldKeysFetch from './field-keys-fetch.vue';
import request from '../../mixins/request';

export default {
  name: 'ProjectHome',
  components: { ProjectFieldKeysFetch },
  mixins: [request()],
  data() {
    return {
      requestId: null,
      maybeProject: null,
      fieldKeysRequestCounter: 0,
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
    fetchProject() {
      this.maybeProject = MaybeData.awaiting();
      this.get(`/projects/${this.projectId}`)
        .then(({ data }) => {
          this.maybeProject = MaybeData.success(data);
        })
        .catch(() => {
          this.maybeProject = MaybeData.error();
        });
    },
    fetchFieldKeys() {
      this.maybeFieldKeys = MaybeData.awaiting();
      this.fieldKeysRequestCounter += 1;
    },
    fetchData() {
      this.fetchProject();
      this.fetchFieldKeys();
    },
    setMaybeFieldKeys(maybeFieldKeys) {
      this.maybeFieldKeys = maybeFieldKeys;
    }
  }
};
</script>
