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
  <modal id="submission-analyze" :state="state" backdrop hideable
    @hide="$emit('hide')">
    <template slot="title">Using OData</template>
    <template slot="body">
      <div id="submission-analyze-head">
        <div class="modal-introduction">
          <p>
            OData is a new standard for transferring data between tools and
            services. Free and powerful analysis tools like Excel,
            <a href="https://powerbi.microsoft.com/en-us/" target="_blank"
              rel="noopener">
              Microsoft Power BI</a>,
            and
            <a href="https://www.tableau.com/" target="_blank" rel="noopener">
              Tableau
            </a>
            can fetch data over OData for analysis.
          </p>
          <p>
            There are many advantages to OData, but importantly it supports the
            full-fidelity transfer of complicated types like numbers and
            geographic data, and it enables the latest version of your data to
            synchronize easily with any tools using it.
          </p>
          <p>
            To begin using OData, select your tool and copy the link into it.
          </p>
        </div>
        <ul class="nav nav-tabs">
          <li :class="tabClass('microsoft')" role="presentation">
            <a href="#" @click.prevent="setTool('microsoft')">Excel/Power BI</a>
          </li>
          <li :class="tabClass('tableau')" role="presentation">
            <a href="#" @click.prevent="setTool('tableau')">Tableau</a>
          </li>
          <li :class="tabClass('other')" role="presentation">
            <a href="#" @click.prevent="setTool('other')">Other</a>
          </li>
        </ul>
      </div>
      <!-- eslint-disable-next-line max-len -->
      <div id="submission-analyze-odata-url" ref="oDataUrl" class="modal-introduction" @click="selectUrl">{{ oDataUrl }}</div>
      <div id="submission-analyze-tool-help" class="modal-introduction">
        <p v-if="tool === 'microsoft'">
          For help using OData with Excel, see
          <a href="https://support.office.com/en-us/article/connect-to-an-odata-feed-power-query-4441a94d-9392-488a-a6a9-739b6d2ad500"
            target="_blank" rel="noopener">
            this page</a>.
          For help with Power BI, see
          <a href="https://docs.microsoft.com/en-us/power-bi/desktop-connect-odata"
            target="_blank" rel="noopener">
            this page</a>.
        </p>
        <p v-else-if="tool === 'tableau'">
          For help using OData with Tableau, see
          <a href="https://onlinehelp.tableau.com/current/pro/desktop/en-us/examples_odata.html"
            target="_blank" rel="noopener">
            this page</a>.
        </p>
        <p v-else-if="tool === 'other'">
          For a full description of our OData support, please see
          <a href="https://odkcentral.docs.apiary.io/#reference/odata-endpoints"
            target="_blank" rel="noopener">
            this article</a>.
        </p>
      </div>
      <div id="submission-analyze-actions-container">
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" @click="$emit('hide')">
            Done
          </button>
        </div>
      </div>
    </template>
  </modal>
</template>

<script>
import { requestData } from '../../store/modules/request';

export default {
  name: 'SubmissionAnalyze',
  props: {
    projectId: {
      type: String,
      required: true
    },
    state: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      tool: 'microsoft'
    };
  },
  computed: {
    ...requestData(['form']),
    oDataUrl() {
      const base = `${window.location.origin}/v1/projects/${this.projectId}/forms/${this.form.encodedId()}.svc`;
      return this.tool !== 'tableau' ? base : `${base}/Submissions?%24wkt=true`;
    }
  },
  watch: {
    state(state) {
      if (!state) this.tool = 'microsoft';
    }
  },
  methods: {
    tabClass(tool) {
      return { active: this.tool === tool };
    },
    setTool(tool) {
      this.tool = tool;
    },
    selectUrl() {
      const selection = window.getSelection();
      // Select the entire URL unless the user has selected specific text.
      if (selection.isCollapsed)
        selection.selectAllChildren(this.$refs.oDataUrl);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#submission-analyze .modal-body {
  padding-left: 0;
  padding-right: 0;

  .modal-introduction {
    margin-bottom: 10px;
  }

  #submission-analyze-head {
    border-bottom: 1px solid $color-subpanel-border-strong;
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;

    .nav-tabs {
      margin-top: 15px;
    }
  }

  #submission-analyze-odata-url {
    background-color: $color-subpanel-background;
    font-family: $font-family-monospace;
    margin-bottom: 10px;
    overflow-x: scroll;
    padding: 12px $padding-modal-body;
    white-space: nowrap;
  }

  #submission-analyze-tool-help {
    margin-top: 15px;
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;

    &:empty {
      margin-top: 0px;
    }
  }

  #submission-analyze-actions-container {
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;
  }
}
</style>
