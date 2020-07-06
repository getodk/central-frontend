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

<!-- Standard form definition buttons -->
<template>
  <span class="form-version-standard-buttons">
    <template v-if="preview">
      <a v-if="previewDisabledTitle == null"
        class="preview-button btn btn-primary" :href="previewUrl"
        target="_blank">
        <span class="icon-eye"></span>{{ $t('action.preview') }}
      </a>
      <button v-else type="button"
        class="preview-button btn btn-primary" disabled
        :title="previewDisabledTitle">
        <span class="icon-eye"></span>{{ $t('action.preview') }}
      </button>
    </template>

    <a v-if="version.excelContentType == null" class="btn btn-primary"
      :href="defPath('xml')" :download="xmlFilename">
      <span class="icon-arrow-circle-down"></span>{{ $t('action.downloadXForm') }}
    </a>
    <div v-else class="btn-group">
      <button :id="dropdownToggleId" type="button"
        class="btn btn-primary dropdown-toggle" data-toggle="dropdown"
        aria-haspopup="true" aria-expanded="false">
        <span class="icon-arrow-circle-down"></span>
        <span>{{ $t('action.download') }}</span>
        <span class="caret"></span>
      </button>
      <ul class="dropdown-menu" :aria-labelledby="dropdownToggleId">
        <li>
          <a :href="defPath('xml')" :download="xmlFilename">{{ $t('format.xForm') }} (.xml)</a>
        </li>
        <li>
          <a :href="defPath(excelExtension)">{{ $t('format.xlsForm') }} (.{{ excelExtension }})</a>
        </li>
      </ul>
    </div>
  </span>
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
    },
    preview: {
      type: Boolean,
      required: false
    }
  },
  computed: {
    previewDisabledTitle() {
      if (this.version.enketoId == null) return this.$t('previewDisabled');
      return this.version.publishedAt != null && this.version.state !== 'open'
        ? this.$t('previewDisabledUnlessOpen')
        : null;
    },
    previewUrl() {
      // enketoId probably doesn't need to be encoded, but there is also little
      // harm.
      return `/enketo/preview/${encodeURIComponent(this.version.enketoId)}`;
    },
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

<style lang="scss">
.form-version-standard-buttons .preview-button {
  margin-right: 5px;
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "downloadXForm": "Download XML",
      "preview": "Preview"
    },
    // Here, the user selects the format that a Form should be downloaded as.
    "format": {
      "xForm": "As XForm",
      "xlsForm": "As XLSForm"
    },
    "previewDisabled": "Preview has not finished processing for this Form. Please refresh later and try again.",
    "previewDisabledUnlessOpen": "In this version of ODK Central, preview is only available for Open Forms."
  }
}
</i18n>
