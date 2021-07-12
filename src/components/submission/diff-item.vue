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
  <div class="submission-diff-item">
    <div v-if="visiblePath.length > 0" class="full-path">
      <template v-for="(field, index) in visiblePath">
        <span :key="index">
          <template v-if="Array.isArray(field)">
            <span>{{ field[0] }}</span>
            <span class="field-counter"> #</span><span>{{ +field[1] + 1 }}</span>
          </template>
          <template v-else>
            <span>{{ field }}</span>
          </template>
          <template v-if="index < visiblePath.length - 1">
            <span class="field-separator"> &rsaquo; </span>
          </template>
        </span>
      </template>
    </div>
    <div>
    <div class="diff-details">
      <template v-if="isAtomicChange">
        <div class="field-name" :title="fieldName">
          {{ fieldName }}
        </div>
        <div class="old-to-new">
          <span v-if="entry.old" class="data-old">{{ entry.old }}</span>
          <span v-else><span class="data-empty">empty</span></span>
          <span class="icon-arrow-circle-right change-icon"></span>
          <span v-if="entry.new" class="data-new">{{ entry.new }}</span>
          <span v-else><span class="data-empty">empty</span></span>
        </div>
      </template>
      <template v-else>
        <div class="nested-change-type" :class="typeOfChange">
          {{ $t(`editCaption.${typeOfChange}`) }}
        </div>
        <div class="nested-changes">
          <submission-diff-item v-for="(change, index) in nestedDiffs" :key="index" :entry="change"/>
        </div>
      </template>
    </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SubmissionDiffItem',
  props: {
    entry: {
      type: Object,
      required: true
    }
  },
  computed: {
    isAtomicChange() {
      // Is this a diff of a single field or whole subtree
      if (this.entry.old === null)
        if (typeof (this.entry.new) === 'object')
          return false;
      if (this.entry.new === null)
        if (typeof (this.entry.old) === 'object')
          return false;
      return true;
    },
    visiblePath() {
      if (!this.isAtomicChange)
        return this.entry.path;
      return this.entry.path.slice(0, this.entry.path.length - 1);
    },
    fieldName() {
      return this.entry.path[this.entry.path.length - 1];
    },
    typeOfChange() {
      if (this.entry.old === null)
        return 'added';
      if (this.entry.new === null)
        return 'deleted';
      return 'changed';
    },
    nestedDiffs() {
      return this.recursivelyUnpack(this.entry.new || this.entry.old, this.typeOfChange);
    }
  },
  methods: {
    recursivelyUnpack(node, typeOfChange, prefix = []) {
      let changes = [];
      // eslint-disable-next-line guard-for-in
      for (const k in node) {
        const path = prefix.concat(k);
        if (Array.isArray(node)) {
          path.pop();
          path.push([prefix[prefix.length - 1], k]);
        }
        if (typeof (node[k]) === 'object') {
          changes = changes.concat(this.recursivelyUnpack(node[k], typeOfChange, path));
        } else if (typeOfChange === 'added') {
          changes.push({ path, old: null, new: node[k] });
        } else {
          changes.push({ path, old: node[k], new: null });
        }
      }
      return changes;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.submission-diff-item {
  border-bottom: 1px solid #ccc;
}

.submission-diff-item:last-child {
  border-bottom: 0;
}

.full-path, .field-name, .nested-change-type {
  font-family: $font-family-monospace;
}

.full-path {
  font-size: 13px;
  color: #333;
  margin: 10px 10px -5px 10px;
}

.field-separator, .field-counter{
  color: #999;
}

.diff-details {
  display: flex;
  font-size: 17px;
}

.field-name, .nested-change-type {
  width: 150px;
  margin: 10px;
}

.field-name {
  color: #000;
  overflow: hidden;
  text-overflow: ellipsis;
}

.old-to-new { margin: 10px; }
.change-icon { color: #888; padding: 5px; }

.data-old { color: red; }
.data-new { color: green; }

.deleted { color: red; }
.added { color: green; }

.data-empty {
  background-color: #bbb;
  color: white;
  padding: 5px;
  border-radius: 2px;
}


</style>

<i18n lang="json5">
{
  "en": {
    // The description of how a specific field in a form submission changed
    "editCaption": {
      "added": "(added)",
      "deleted": "(deleted)",
    }
  }
}
</i18n>
