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
  <router-view :project-id="projectId" :project="project"/>
</template>

<script>
import request from '../../mixins/request';

export default {
  name: 'ProjectHome',
  mixins: [request()],
  data() {
    return {
      requestId: null,
      project: null
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
      this.get(`/projects/${this.projectId}`)
        .then(({ data }) => {
          this.project = data;
        })
        .catch(() => {});
    }
  }
};
</script>
