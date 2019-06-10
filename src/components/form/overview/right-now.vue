<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <page-section v-if="project != null && form != null"
    id="form-overview-right-now">
    <template #heading>
      <span>Right Now</span>
    </template>
    <template #body>
      <summary-item icon="archive">
        <template #heading>
          <span id="form-overview-right-now-version" :title="form.version">
            {{ form.version }}
          </span>
          <a :href="xmlPath" class="btn btn-primary" target="_blank">
            <span class="icon-arrow-circle-down"></span>View XML
          </a>
        </template>
        <template #body>
          <strong>Current version</strong> of this Form.
        </template>
      </summary-item>
      <summary-item :route-to="submissionsPath" icon="archive">
        <template #heading>
          {{ form.submissions.toLocaleString() }}
          <span class="icon-angle-right"></span>
        </template>
        <template #body>
          <template v-if="form.submissions === 1">
            <strong>Submission</strong> has been saved for this Form.
          </template>
          <template v-else>
            <strong>Submissions</strong> have been saved for this Form.
          </template>
        </template>
      </summary-item>
    </template>
  </page-section>
</template>

<script>
import SummaryItem from '../../summary-item.vue';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'FormOverviewRightNow',
  components: { SummaryItem },
  computed: {
    ...requestData(['project', 'form']),
    xmlPath() {
      return `/v1/projects/${this.project.id}/forms/${this.form.xmlFormId}.xml`;
    },
    submissionsPath() {
      return `/projects/${this.project.id}/forms/${this.form.xmlFormId}/submissions`;
    }
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#form-overview-right-now {
  .btn {
    bottom: 10px;
    position: relative;
  }

  .icon-angle-right {
    color: $color-accent-primary;
    font-size: 20px;
    margin-right: 0;
    vertical-align: 2px;
  }
}

#form-overview-right-now-version {
  display: inline-block;
  font-family: $font-family-monospace;
  max-width: calc(100% - 90px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
