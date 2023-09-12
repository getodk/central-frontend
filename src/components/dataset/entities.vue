<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<template>
  <div>
    <page-section>
      <template #heading>
        <span>{{ $t('resource.entities') }}</span>
        <odata-data-access @analyze="showModal('analyze')"/>
      </template>
      <template #body>
        <entity-list :project-id="projectId" :dataset-name="datasetName"/>
      </template>
    </page-section>
    <odata-analyze v-bind="analyze" :odata-url="odataUrl" @hide="hideModal('analyze')"/>
  </div>
</template>

<script>
import OdataAnalyze from '../odata/analyze.vue';
import OdataDataAccess from '../odata/data-access.vue';
import EntityList from '../entity/list.vue';
import PageSection from '../page/section.vue';

import modal from '../../mixins/modal';
import { apiPaths } from '../../util/request';

export default {
  name: 'DatasetEntities',
  components: {
    OdataAnalyze,
    OdataDataAccess,
    EntityList,
    PageSection
  },
  mixins: [modal()],
  props: {
    projectId: {
      type: String,
      required: true
    },
    datasetName: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      analyze: {
        state: false
      }
    };
  },
  computed: {
    odataUrl() {
      const path = apiPaths.odataEntitiesSvc(this.projectId, this.datasetName);
      return `${window.location.origin}${path}`;
    }
  }
};
</script>

<style lang="scss">
#odata-data-access { float: right; }
</style>
