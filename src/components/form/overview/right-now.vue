<!--
Copyright 2019 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <page-section id="form-overview-right-now" condensed>
    <template #heading>
      <span>Right Now</span>
    </template>
    <template #body>
      <form-version-summary-item :version="form">
        <template #body>
          <p><strong>Published version</strong> of this Form.</p>
        </template>
      </form-version-summary-item>
      <summary-item :route-to="formPath('submissions')" icon="inbox">
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
import FormVersionSummaryItem from '../../form-version/summary-item.vue';
import PageSection from '../../page/section.vue';
import SummaryItem from '../../summary-item.vue';
import routes from '../../../mixins/routes';
import { requestData } from '../../../store/modules/request';

export default {
  name: 'FormOverviewRightNow',
  components: { FormVersionSummaryItem, PageSection, SummaryItem },
  mixins: [routes()],
  // The component assumes that this data will exist when the component is
  // created.
  computed: requestData(['form'])
};
</script>
