<!--
Copyright 2021 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="submission-diff-item" :class="nestedClass">
    <div v-if="visiblePath.length > 0" class="full-path">
      <span v-for="(field, index) in visiblePath" :key="index">
        <template v-if="Array.isArray(field)">
          <span>{{ field[0] }}</span>
          <span class="field-counter"> #</span><span>{{ field[1] + 1 }}</span>
        </template>
        <template v-else>
          <span>{{ field }}</span>
        </template>
        <template v-if="index < visiblePath.length - 1">
          <span class="field-separator"> &rsaquo; </span>
        </template>
      </span>
    </div>
    <div class="diff-details">
      <template v-if="isAtomicChange">
        <div class="field-name" :title="fieldName">
          {{ fieldName }}
        </div>
        <div class="old-to-new">
          <span v-if="entry.old" class="data-old" :title="entry.old">
            <template v-if="isBinary">
              <a :href="binaryHref(entry.old, true)">{{ entry.old }}</a>
            </template>
            <template v-else>{{ entry.old }}</template>
          </span>
          <span v-else class="data-empty">{{ $t('empty') }}</span>
          <span class="icon-arrow-circle-right"></span>
          <span v-if="entry.new" class="data-new" :title="entry.new">
            <template v-if="isBinary">
              <a :href="binaryHref(entry.new, false)">{{ entry.new }}</a>
            </template>
            <template v-else>{{ entry.new }}</template>
          </span>
          <span v-else class="data-empty">{{ $t('empty') }}</span>
        </div>
      </template>
      <template v-else>
        <div class="nested-change-type" :class="typeOfChange">
          {{ $t(`editCaption.${typeOfChange}`) }}
        </div>
        <div>
          <submission-diff-item v-for="(change, index) in nestedDiffs" :key="index" :entry="change" :parent-path="entry.path"
            :project-id="projectId" :xml-form-id="xmlFormId" :instance-id="instanceId"
            :old-version-id="oldVersionId" :new-version-id="newVersionId"/>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { last } from 'ramda';

import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';

export default {
  name: 'SubmissionDiffItem',
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    },
    instanceId: {
      type: String,
      required: true
    },
    oldVersionId: {
      type: String,
      required: false // only used for making binary file link
    },
    newVersionId: {
      type: String,
      required: false // only used for making binary file link
    },
    entry: {
      type: Object,
      required: true
    },
    parentPath: {
      type: Array,
      default() {
        return [];
      }
    }
  },
  setup() {
    const { fields } = useRequestData();
    return { fields };
  },
  computed: {
    isAtomicChange() {
      // Check whether the change is of a single field (atomic)
      // or if it is of a whole subtree being added or removed.
      // If one side is null (addition or deletion) and the remaining
      // side is an object, then it is NOT an atomic change.
      if (this.entry.old == null && typeof (this.entry.new) === 'object')
        return false;
      if (this.entry.new == null && typeof (this.entry.old) === 'object')
        return false;
      return true;
    },
    visiblePath() {
      // If the change is atomic, it will split the path into the field name
      // of the changed leaf node and the preceeding part of the path (which
      // could be empty for a short path).
      // Otherwise, it will show the whole path of the changed subtree.
      if (!this.isAtomicChange)
        return this.entry.path;
      return this.entry.path.slice(0, this.entry.path.length - 1);
    },
    fieldName() {
      return last(this.entry.path);
    },
    nestedClass() {
      return this.parentPath.length === 0 ? 'outer-item' : 'inner-item';
    },
    typeOfChange() {
      // Check which value is null (old or new) to determine the
      // type of change or edit.
      // This is only used for non-atomic (nested) changes so
      // it will always be one or the other.
      return (this.entry.old == null ? 'added' : 'deleted');
    },
    nestedDiffs() {
      return this.flattenDiff(this.entry.new || this.entry.old, this.typeOfChange);
    },
    isBinary() {
      // Compares path as array by converting it to /field1/field2 string and checks
      // if it is for a binary field.
      // Filtering out where field[0] == undefined addresses issue with flattenDiff and repeat groups
      const fullPath = this.parentPath.concat(this.entry.path.filter((field) => field[0] !== undefined));
      const fullPathStr = fullPath.map((field) => (Array.isArray(field) ? field[0] : field)).join('/');
      const basicPath = `/${fullPathStr}`;
      if (this.fields.binaryPaths.has(basicPath))
        return true;
      return false;
    }
  },
  methods: {
    flattenDiff(node, typeOfChange, prefix = []) {
      // Flattens the inner diff (JSON of an entire added/removed tree structure)
      // by recursively traversing the tree
      const changes = [];
      // eslint-disable-next-line guard-for-in
      for (const k in node) {
        const path = prefix.concat(k);
        if (Array.isArray(node)) {
          path.pop(); // pop off the index (e.g. 1 of toy #1)
          path.pop(); // pop off the name (e.g. toy of toy #1)
          path.push([prefix[prefix.length - 1], Number.parseInt(k, 10)]);
        }
        if (typeof (node[k]) === 'object') {
          changes.push(...this.flattenDiff(node[k], typeOfChange, path));
        } else if (typeOfChange === 'added') {
          changes.push({ path, old: null, new: node[k] });
        } else {
          changes.push({ path, old: node[k], new: null });
        }
      }
      return changes;
    },
    binaryHref(value, useOldVersion) {
      return apiPaths.submissionVersionAttachment(
        this.projectId,
        this.xmlFormId,
        this.instanceId,
        useOldVersion ? this.oldVersionId : this.newVersionId,
        value
      );
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.submission-diff-item {

  &.outer-item {
    padding: 5px;
    border-bottom: 1px solid #ccc;

    &:last-child { border-bottom: 0; }
  }

  &.inner-item {
    padding: 0px;
    border-bottom: 1px solid #ddd;

    &:last-child { border-bottom: 0; }
  }

  .full-path, .field-name {
    font-family: $font-family-monospace;
  }

  .full-path {
    font-size: 11px;
    color: #333;
    letter-spacing: -0.02em;
    margin: 10px 10px -5px 10px;
  }

  .field-separator, .field-counter{
    color: #999;
  }

  .diff-details {
    display: flex;
    font-size: 13px;
    align-items: baseline;
  }

  .field-name, .nested-change-type {
    width: 150px;
    margin: 0 10px;
    font-size: 13px;
    flex-shrink: 0;
  }

  .nested-change-type {
    margin-top: 12px;
  }

  .field-name {
    color: #000;
    @include text-overflow-ellipsis;
  }

  .old-to-new { margin: 0 10px; }
  .icon-arrow-circle-right { color: #888; padding: 10px; }

  .data-old { color: $color-danger-dark; }
  .data-new { color: $color-success-dark; }


  .old-to-new {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .data-old, .data-new {
    @include text-overflow-ellipsis;
    max-width: 250px;
  }

  .deleted { color: $color-danger-dark; }
  .added { color: $color-success-dark; }

  .data-empty {
    background-color: #aaa;
    color: white;
    padding: 2px 5px 3px;
    border-radius: 2px;
    font-size: 12px;
  }
}

</style>

<i18n lang="json5">
{
  "en": {
    // The description of how a specific field in a form submission changed
    "editCaption": {
      "added": "(added)",
      "deleted": "(deleted)",
    },
    // Text showing that a value in a submission edit is empty
    "empty": "empty"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "editCaption": {
      "added": "(přidáno)",
      "deleted": "(smazáno)"
    },
    "empty": "prázdné"
  },
  "de": {
    "editCaption": {
      "added": "(hinzugefügt)",
      "deleted": "(gelöscht)"
    },
    "empty": "leer"
  },
  "es": {
    "editCaption": {
      "added": "(añadido)",
      "deleted": "(borrado)"
    },
    "empty": "(vacío)"
  },
  "fr": {
    "editCaption": {
      "added": "(ajouté)",
      "deleted": "(supprimé)"
    },
    "empty": "vide"
  },
  "id": {
    "editCaption": {
      "added": "(ditambahkan)",
      "deleted": "(dihapus)"
    },
    "empty": "kosong"
  },
  "it": {
    "editCaption": {
      "added": "(aggiunto)",
      "deleted": "(cancellato)"
    },
    "empty": "vuoto"
  },
  "ja": {
    "editCaption": {
      "added": "（追加済み）",
      "deleted": "（削除済み）"
    },
    "empty": "空"
  },
  "sw": {
    "editCaption": {
      "added": "(imeongezwa)",
      "deleted": "(imefutwa)"
    },
    "empty": "tupu"
  }
}
</i18n>
