<!--
Copyright 2020 ODK Central Developers
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
    <form-version-table @view-xml="showModal('viewXml')"/>
    <loading :state="formVersions.initiallyLoading"/>

    <form-version-view-xml v-bind="viewXml" @hide="hideModal('viewXml')"/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

import FormVersionTable from './table.vue';
import Loading from '../loading.vue';

import modal from '../../mixins/modal';
import { apiPaths } from '../../util/request';
import { loadAsync } from '../../util/load-async';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'FormVersionList',
  components: {
    FormVersionTable,
    FormVersionViewXml: defineAsyncComponent(loadAsync('FormVersionViewXml')),
    Loading
  },
  mixins: [modal({ viewXml: 'FormVersionViewXml' })],
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    }
  },
  setup() {
    const { formVersions } = useRequestData();
    return { formVersions };
  },
  data() {
    return {
      viewXml: {
        state: false
      }
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      // We do not reconcile requestData.form and requestData.formVersions.
      this.formVersions.request({
        url: apiPaths.formVersions(this.projectId, this.xmlFormId),
        extended: true,
        resend: false
      }).catch(noop);
    }
  }
};
</script>
