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
  <div id="dataset-show">
    <page-back v-show="dataExists && !awaitingResponse" :to="projectPath('datasets')">
      <template #title>{{ project.dataExists ? project.nameWithArchived : '' }}</template>
      <template #back>{{ $t('back') }}</template>
    </page-back>
    <page-head v-show="dataExists && !awaitingResponse">
      <template #title>
{{ datasetName }}
        <span class="icon-cube"></span>
      </template>
      <template #tabs>
        <li :class="tabClass('')" role="presentation">
          <router-link :to="tabPath('')">
            {{ $t('common.tab.overview') }}
          </router-link>
        </li>
        <li class="disabled" role="presentation">
          <a href="#">
            {{ $t('data') }}
            <span class="coming-soon">{{ $t('comingSoon') }}</span>
          </a>
        </li>
        <li class="disabled" role="presentation">
          <a href="#">
            {{ $t('common.tab.settings') }}
            <span class="coming-soon">{{ $t('comingSoon') }}</span>
          </a>
        </li>
      </template>
    </page-head>
    <page-body>
      <loading :state="initiallyLoading || awaitingResponse"/>
      <router-view v-show="dataExists && !awaitingResponse"/>
    </page-body>
  </div>
</template>

<script>
import Loading from '../loading.vue';
import PageBack from '../page/back.vue';
import PageBody from '../page/body.vue';
import PageHead from '../page/head.vue';
import routes from '../../mixins/routes';
import tab from '../../mixins/tab';

import { useRequestData } from '../../request-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

export default {
  name: 'DatasetShow',
  components: {
    Loading,
    PageBack,
    PageBody,
    PageHead
  },
  mixins: [routes(), tab()],
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
  // The component does not assume that this data will exist when the
  // component is created.
    const { project, dataset, resourceStates } = useRequestData();
    return { project, dataset, ...resourceStates([project, dataset]) };
  },
  data() {
    return {
      awaitingResponse: false
    };
  },
  computed: {
    tabPathPrefix() {
      return `${this.projectPath('datasets')}/${this.datasetName}`;
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchProject(resend) {
      this.project.request({
        url: apiPaths.project(this.projectId),
        extended: true,
        resend
      }).catch(noop);
    },
    fetchDataset(resend) {
      this.dataset.request({
        url: apiPaths.dataset(this.projectId, this.datasetName),
        resend
      }).catch(noop);
    },
    fetchData() {
      this.fetchProject(false);
      this.fetchDataset(false);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#dataset-show {
  .coming-soon {
    color: $color-text;
    font-size: 10px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is shown at the top of the page.
    "back": "Back to Project Datasets",
    "comingSoon": "(coming soon)",
    "data": "Data"
  }
}
</i18n>
