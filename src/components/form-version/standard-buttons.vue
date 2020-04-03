<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<!-- Standard form definition buttons -->
<template>
  <a v-if="version.excelContentType == null" class="btn btn-primary"
    :href="defPath('xml')" :download="xmlFilename">
    <span class="icon-arrow-circle-down"></span>Download XML
  </a>
  <div v-else class="btn-group">
    <button :id="dropdownToggleId" type="button"
      class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
      aria-haspopup="true" aria-expanded="false">
      <span class="icon-arrow-circle-down"></span>
      <span>Download</span>
      <span class="caret"></span>
    </button>
    <ul class="dropdown-menu" :aria-labelledby="dropdownToggleId">
      <li>
        <a :href="defPath('xml')" :download="xmlFilename">As XForm (.xml)</a>
      </li>
      <li>
        <a :href="defPath(excelExtension)">As Excel (.{{ excelExtension }})</a>
      </li>
    </ul>
  </div>
</template>

<script>
import Form from '../../presenters/form';
import { apiPaths } from '../../util/request';

export default {
  name: 'FormVersionStandardButtons',
  props: {
    version: {
      type: Form,
      required: true
    }
  },
  computed: {
    xmlFilename() {
      return `${this.version.xmlFormId}.xml`;
    },
    dropdownToggleId() {
      const { key } = this.version;
      return `#form-version-standard-buttons-dropdown-toggle-${key}`;
    },
    excelExtension() {
      return this.version.excelContentType === 'application/vnd.ms-excel'
        ? 'xls'
        : 'xlsx';
    }
  },
  methods: {
    defPath(extension) {
      const { projectId, xmlFormId, publishedAt } = this.version;
      return publishedAt != null
        ? apiPaths.formVersionDef(projectId, xmlFormId, this.version.version, extension)
        : apiPaths.formDraftDef(projectId, xmlFormId, extension);
    }
  }
};
</script>
