<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="dataset-list">
    <div class="page-body-heading">
      <p>{{ $t('heading[0]') }}</p>
      <p>
        <span>{{ $t('heading[1]') }}</span>
        <sentence-separator/>
        <i18n-t keypath="moreInfo.clickHere.full">
          <template #clickHere>
            <doc-link to="central-entities">{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
          </template>
        </i18n-t>
      </p>
    </div>
    <dataset-table/>
    <loading :state="datasets.initiallyLoading"/>
  </div>
</template>

<script>
export default {
  name: 'DatasetList'
};
</script>
<script setup>
import DatasetTable from './table.vue';
import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import SentenceSeparator from '../sentence-separator.vue';

import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
});

const { datasets } = useRequestData();
datasets.request({
  url: apiPaths.datasets(props.projectId),
  extended: true,
  resend: false
}).catch(noop);
</script>

<i18n lang="json5">
  {
    "en": {
      "heading": [
        // A brief introduction to Entities shown above Entity Lists for the current Project
        "Entities let you share information between Forms so you can collect longitudinal data, manage cases over time, and represent other workflows with multiple steps.",
        "Entities are created through form design and can be attached to any Form."
      ]
    }
  }
</i18n>
