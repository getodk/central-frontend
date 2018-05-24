<!--
Copyright 2017 Super Adventure Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/nafundi/super-adventure/blob/master/NOTICE.

This file is part of Super Adventure. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of Super Adventure,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="form-analyze" :state="state" backdrop hideable
    @hide="$emit('hide')">
    <template slot="title">Using OData</template>
    <template slot="body">
      <div id="form-analyze-head">
        <div class="modal-introduction">
          <p>
            OData is a new standard for transferring data between tools and
            services. Free and powerful analysis tools like Excel,
            <a :href="links.powerBi.home" target="_blank" rel="noopener">Microsoft Power BI</a>,
            and
            <a :href="links.tableau.home" target="_blank" rel="noopener">
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
            <a href="#" @click.prevent="tool = 'microsoft'">Excel/Power BI</a>
          </li>
          <li :class="tabClass('tableau')" role="presentation">
            <a href="#" @click.prevent="tool = 'tableau'">Tableau</a>
          </li>
          <li :class="tabClass('other')" role="presentation">
            <a href="#" @click.prevent="tool = 'other'">Other</a>
          </li>
        </ul>
      </div>
      <!-- eslint-disable-next-line max-len -->
      <p id="form-analyze-odata-url" ref="oDataUrl" class="modal-introduction text-monospace" @click="selectUrl">{{ oDataUrl }}</p>
      <div id="form-analyze-tool-help" class="modal-introduction">
        <p v-if="tool === 'microsoft'">
          For help using OData with Excel, see
          <a :href="links.excel.help" target="_blank" rel="noopener">this page</a>.
          For help with Power BI, see
          <a :href="links.powerBi.help" target="_blank" rel="noopener">this page</a>.
        </p>
        <p v-else-if="tool === 'tableau'">
          For help using OData with Tableau, see
          <a :href="links.tableau.help" target="_blank" rel="noopener">this page</a>.
        </p>
      </div>
      <div id="form-analyze-actions-container">
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
export default {
  name: 'FormAnalyze',
  props: {
    state: {
      type: Boolean,
      default: false
    },
    form: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      tool: 'microsoft'
    };
  },
  computed: {
    links() {
      return {
        excel: {
          help: 'https://support.office.com/en-us/article/connect-to-an-odata-feed-power-query-4441a94d-9392-488a-a6a9-739b6d2ad500'
        },
        powerBi: {
          home: 'https://powerbi.microsoft.com/en-us/',
          help: 'https://docs.microsoft.com/en-us/power-bi/desktop-connect-odata'
        },
        tableau: {
          home: 'https://www.tableau.com/',
          help: 'https://onlinehelp.tableau.com/current/pro/desktop/en-us/examples_odata.html'
        }
      };
    },
    oDataUrl() {
      const base = `${window.location.origin}/v1/forms/${this.form.xmlFormId}.svc`;
      return this.tool !== 'tableau' ? base : `${base}/Submissions?$wkt=true`;
    }
  },
  methods: {
    tabClass(tool) {
      return { active: this.tool === tool };
    },
    selectUrl() {
      if (window.getSelection == null) return;
      const selection = window.getSelection();
      // If the user has selected specific text, do not alter their selection.
      if (!selection.isCollapsed) return;
      selection.selectAllChildren(this.$refs.oDataUrl);
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

#form-analyze .modal-body {
  padding-left: 0;
  padding-right: 0;

  .modal-introduction {
    margin-bottom: 10px;
  }

  #form-analyze-head {
    border-bottom: 1px solid $color-subpanel-border-strong;
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;

    .nav-tabs {
      margin-top: 15px;
    }
  }

  #form-analyze-odata-url {
    background-color: $color-subpanel-background;
    overflow-x: scroll;
    padding: 12px $padding-modal-body;
  }

  #form-analyze-tool-help {
    margin-top: 15px;
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;

    &:empty {
      margin-top: 0px;
    }
  }

  #form-analyze-actions-container {
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;
  }
}
</style>
