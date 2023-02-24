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
  <modal id="odata-analyze" :state="state" hideable backdrop
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div id="odata-analyze-head">
        <div class="modal-introduction">
          <i18n-t tag="p" keypath="introduction[0]">
            <template #powerBi>
              <a href="https://powerbi.microsoft.com/en-us/" target="_blank" rel="noopener">Power BI</a>
            </template>
            <template #excel>
              <a href="https://www.microsoft.com/en-us/microsoft-365/excel" target="_blank" rel="noopener">Excel</a>
            </template>
            <template #python>
              <a href="https://www.python.org/" target="_blank" rel="noopener">Python</a>
            </template>
            <template #r>
              <a href="https://www.r-project.org" target="_blank" rel="noopener">R</a>
            </template>
          </i18n-t>
          <p>{{ $t('introduction[1]') }}</p>
        </div>
        <ul class="nav nav-tabs">
          <li :class="tabClass('microsoft')" role="presentation">
            <a href="#" @click.prevent="setTool('microsoft')">{{ $t('tab.microsoft') }}</a>
          </li>
          <li :class="tabClass('python')" role="presentation">
            <a href="#" @click.prevent="setTool('python')">Python</a>
          </li>
          <li :class="tabClass('r')" role="presentation">
            <a href="#" @click.prevent="setTool('r')">R</a>
          </li>
          <li :class="tabClass('other')" role="presentation">
            <a href="#" @click.prevent="setTool('other')">{{ $t('tab.other') }}</a>
          </li>
        </ul>
      </div>
      <div id="odata-analyze-odata-url" class="modal-introduction">
        <selectable>{{ odataUrl }}</selectable>
      </div>
      <div id="odata-analyze-tool-help" class="modal-introduction">
        <i18n-t v-if="tool === 'microsoft'" tag="p" keypath="help.microsoft.full">
          <template #pageForExcel>
            <a href="https://support.microsoft.com/en-us/office/about-power-query-in-excel-7104fbee-9e62-4cb9-a02e-5bfb1a6c536a" target="_blank" rel="noopener">{{ $t('help.microsoft.pageForExcel') }}</a>
          </template>
          <template #pageForPowerBi>
            <a href="https://learn.microsoft.com/en-us/power-bi/connect-data/desktop-connect-odata" target="_blank" rel="noopener">{{ $t('help.microsoft.pageForPowerBi') }}</a>
          </template>
        </i18n-t>
        <i18n-t v-else-if="tool === 'python'" tag="p" keypath="help.python">
          <template #pyODK>
            <a href="https://github.com/getodk/pyodk/" target="_blank" rel="noopener">PyODK</a>
          </template>
        </i18n-t>
        <i18n-t v-else-if="tool === 'r'" tag="p" keypath="help.r">
          <template #ruODK>
            <a href="https://docs.ropensci.org/ruODK/" target="_blank" rel="noopener">ruODK</a>
          </template>
        </i18n-t>
        <i18n-t v-else-if="tool === 'other'" tag="p" keypath="help.other.full">
          <template #article>
            <a href="https://odkcentral.docs.apiary.io/#reference/odata-endpoints" target="_blank" rel="noopener">{{ $t('help.other.article') }}</a>
          </template>
        </i18n-t>
      </div>
      <div id="odata-analyze-actions-container">
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
import Selectable from '../selectable.vue';

export default {
  // Ideally, this component would be named OdataAnalyze and be moved to ../odata,
  // like with SubmissionDecrypt->SubmissionDownload,
  // but that would cause messages to be moved in Transifex.
  name: 'SubmissionAnalyze',
  components: { Modal, Selectable },
  props: {
    state: Boolean,
    odataUrl: String
  },
  emits: ['hide'],
  data() {
    return {
      tool: 'microsoft'
    };
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
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#odata-analyze .modal-body {
  padding-left: 0;
  padding-right: 0;

  .modal-introduction {
    margin-bottom: 10px;
  }

  #odata-analyze-head {
    border-bottom: 1px solid $color-subpanel-border-strong;
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;

    .nav-tabs {
      margin-top: 15px;
    }
  }

  #odata-analyze-odata-url {
    background-color: $color-subpanel-background;
    margin-bottom: 10px;
    padding: 12px $padding-modal-body;
  }

  #odata-analyze-tool-help {
    margin-top: 15px;
    padding-left: $padding-modal-body;
    padding-right: $padding-modal-body;

    &:empty {
      margin-top: 0px;
    }
  }

  #odata-analyze-actions-container {
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
      // The text of {python} is "Python". The text of {excel} is "Excel".
      // {powerBi}, {r}, {excel} and {python} are all links.
      "OData is a standard for transferring data between tools and services. Free and powerful analysis tools like {powerBi}, {excel}, {python}, and {r} can fetch data via OData for analysis.",
      "To connect to this form’s OData feed, select your tool and copy the link into it."
    ],
    "tab": {
      "microsoft": "Power BI or Excel",
      // This is the text of a navigation tab. "Other" refers to "other tool".
      "other": "Other"
    },
    "help": {
      "microsoft": {
        "full": "For help using OData with Power BI, see {pageForPowerBi}. For help with Excel, see {pageForExcel}.",
        "pageForExcel": "this page",
        "pageForPowerBi": "this page"
      },
      "python": "To connect to Central from Python, we recommend {pyODK}. pyODK is the official Python client for Central and it makes common data analysis and workflow automation tasks simple.",
      "r": "To connect to Central from R, we recommend {ruODK}. ruODK is developed and supported by ODK community members.",
      "other": {
        "full": "For a full description of our OData support, please see {article}.",
        "article": "this article"
      }
    }
  }
}
</i18n>

