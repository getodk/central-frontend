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
        <button v-if="project.dataExists && project.permits('entity.create')"
          id="dataset-entities-upload-button" type="button"
          class="btn btn-primary" @click="showModal('upload')">
          <span class="icon-upload"></span>{{ $t('action.upload') }}
        </button>
        <odata-data-access @analyze="showModal('analyze')"/>
      </template>
      <template #body>
        <entity-list :project-id="projectId" :dataset-name="datasetName"/>
      </template>
    </page-section>

    <entity-upload v-if="dataset.dataExists" v-bind="upload"
      @hide="hideModal('upload')" @success="afterUpload"/>
    <odata-analyze v-bind="analyze" :odata-url="odataUrl" @hide="hideModal('analyze')"/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

import EntityList from '../entity/list.vue';
import OdataAnalyze from '../odata/analyze.vue';
import OdataDataAccess from '../odata/data-access.vue';
import PageSection from '../page/section.vue';

import modal from '../../mixins/modal';
import { apiPaths } from '../../util/request';
import { loadAsync } from '../../util/load-async';
import { useRequestData } from '../../request-data';

export default {
  name: 'DatasetEntities',
  components: {
    OdataAnalyze,
    OdataDataAccess,
    EntityList,
    EntityUpload: defineAsyncComponent(loadAsync('EntityUpload')),
    PageSection
  },
  mixins: [modal({ upload: 'EntityUpload' })],
  inject: ['alert'],
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
  setup() {
    const { project, dataset } = useRequestData();
    return { project, dataset };
  },
  data() {
    return {
      upload: {
        state: false
      },
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
  },
  methods: {
    afterUpload() {
      this.hideModal('upload');
      this.alert.success('Entities were imported successfully! [TODO: i18n]');
    }
  }
};
</script>

<style lang="scss">
#odata-data-access { float: right; }
</style>
