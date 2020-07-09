<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <modal id="submission-analyze" :state="state" hideable backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div id="submission-analyze-head">
        <div class="modal-introduction">
          <i18n tag="p" path="introduction[0]">
            <template #powerBi>
              <a href="https://powerbi.microsoft.com/en-us/" target="_blank" rel="noopener">Microsoft Power BI</a>
            </template>
            <template #r>
              <a href="https://www.r-project.org" target="_blank" rel="noopener">R</a>
            </template>
          </i18n>
          <p>{{ $t('introduction[1]') }}</p>
          <p>{{ $t('introduction[2]') }}</p>
        </div>
        <ul class="nav nav-tabs">
          <li :class="tabClass('microsoft')" role="presentation">
            <a href="#" @click.prevent="setTool('microsoft')">{{ $t('tab.microsoft') }}</a>
          </li>
          <li :class="tabClass('r')" role="presentation">
            <a href="#" @click.prevent="setTool('r')">R</a>
          </li>
          <li :class="tabClass('other')" role="presentation">
            <a href="#" @click.prevent="setTool('other')">{{ $t('tab.other') }}</a>
          </li>
        </ul>
      </div>
      <div id="submission-analyze-odata-url" ref="oDataUrl" class="modal-introduction" @click="selectUrl">{{ oDataUrl }}</div>
      <div id="submission-analyze-tool-help" class="modal-introduction">
        <i18n v-if="tool === 'microsoft'" tag="p" path="help.microsoft.full">
          <template #pageForExcel>
            <a href="https://support.office.com/en-us/article/connect-to-an-odata-feed-power-query-4441a94d-9392-488a-a6a9-739b6d2ad500" target="_blank" rel="noopener">{{ $t('help.microsoft.pageForExcel') }}</a>
          </template>
          <template #pageForPowerBi>
            <a href="https://docs.microsoft.com/en-us/power-bi/desktop-connect-odata" target="_blank" rel="noopener">{{ $t('help.microsoft.pageForPowerBi') }}</a>
          </template>
        </i18n>
        <template v-else-if="tool === 'r'">
          <i18n tag="p" path="help.r[0].full">
            <template #r>
              <a href="https://www.r-project.org" target="_blank" rel="noopener">R</a>
            </template>
            <template #ruODK>
              <a href="https://dbca-wa.github.io/ruODK/" target="_blank" rel="noopener">ruODK</a>
            </template>
            <template #oData>
              <a href="https://dbca-wa.github.io/ruODK/articles/odata-api.html" target="_blank" rel="noopener">OData</a>
            </template>
            <template #restful>
              <a href="https://dbca-wa.github.io/ruODK/articles/restful-api.html" target="_blank" rel="noopener">{{ $t('help.r[0].restful') }}</a>
            </template>
          </i18n>
          <i18n tag="p" path="help.r[1].full">
            <template #here>
              <a href="https://dbca-wa.github.io/ruODK/CONTRIBUTING.html" target="_blank" rel="noopener">{{ $t('help.r[1].here') }}</a>
            </template>
          </i18n>
        </template>
        <i18n v-else-if="tool === 'other'" tag="p" path="help.other.full">
          <template #article>
            <a href="https://odkcentral.docs.apiary.io/#reference/odata-endpoints" target="_blank" rel="noopener">{{ $t('help.other.article') }}</a>
          </template>
        </i18n>
      </div>
      <div id="submission-analyze-actions-container">
        <div class="modal-actions">
          <button type="button" class="btn btn-primary" @click="$emit('hide')">
            {{ $t('action.done') }}
          </button>
        </div>
      </div>
    </template>
  </modal>
</template>

<script>
import Modal from '../modal.vue';

export default {
  name: 'SubmissionAnalyze',
  components: { Modal },
  props: {
    baseUrl: {
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
    oDataUrl() {
      return `${window.location.origin}${this.baseUrl}.svc`;
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
    overflow-x: auto;
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

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Using OData",
    "introduction": [
      // The text of {powerBi} is "Microsoft Power BI". The text of {r} is "R".
      // {powerBi} and {r} are both links.
      "OData is a new standard for transferring data between tools and services. Free and powerful analysis tools like Excel, {powerBi}, and {r} can fetch data over OData for analysis.",
      "There are many advantages to OData, but importantly it supports the full-fidelity transfer of complicated types like numbers and geographic data, and it enables the latest version of your data to synchronize easily with any tools using it.",
      "To begin using OData, select your tool and copy the link into it."
    ],
    "tab": {
      "microsoft": "Excel/Power BI",
      // This is the text of a navigation tab. "Other" refers to "other tool".
      "other": "Other"
    },
    "help": {
      "microsoft": {
        "full": "For help using OData with Excel, see {pageForExcel}. For help with Power BI, see {pageForPowerBi}.",
        "pageForExcel": "this page",
        "pageForPowerBi": "this page"
      },
      "r": [
        {
          // The text of {r} is "R". The text of {ruODK} is "ruODK". The text of
          // {oData} is "OData". All three are links.
          "full": "To access Central data from {r}, we recommend you use {ruODK}. See ruODK’s vignettes for examples of using both the {oData} and the {restful} API.",
          "restful": "RESTful"
        },
        {
          "full": "Just like ODK itself, ruODK is developed and supported by community members. If you wish to help improve it, you can find information {here}.",
          "here": "here"
        }
      ],
      "other": {
        "full": "For a full description of our OData support, please see {article}.",
        "article": "this article"
      }
    }
  }
}
</i18n>
