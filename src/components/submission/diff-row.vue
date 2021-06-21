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
  <div v-if="!hidden" class="submission-diff-row">
    <div v-if="prettyPath" class="diff-path outer-diff-path">
      {{ prettyPath(entry.path, edit) }}
    </div>
    <div class="diff-details">
      <table>
        <tr>
          <td style="vertical-align: top;">
            <div v-if="changedField(entry.path, edit)" class="diff-field">{{ changedField(entry.path, edit) }}</div>
            <div v-if="editCaption" class="diff-edit-caption" :style="{color: captionColor}">({{ editCaption }})</div>
          </td>
          <td>
            <span v-if="edit==='changed'" class="diff-data">
                <span v-if="entry.old">
                  {{ entry.old }}
                </span>
                <span v-else>
                  <span class="empty-data">empty</span>
                </span>

                <span class="icon-arrow-circle-right submission-diff-change-icon"></span>

                <span v-if="entry.new">
                  {{ entry.new }}
                </span>
                <span v-else>
                  <span class="empty-data">empty</span>
                </span>
            </span>
            <span v-else>
              <div v-for="(arr, index) of recursivelyUnpack( entry.new || entry.old )" :key="index" class="submission-diff-row-inner">
                <div v-if="prettyPath" class="diff-path">
                  {{ prettyPath(arr[0], 'changed') }}
                </div>

                <table>
                  <!--how do i do grids-->
                  <tr>
                    <td>
                      <div class="inner-diff-field">
                      {{ changedField(arr[0], 'changed') }}
                      </div>
                    </td>
                    <td class="diff-data">
                      <span v-if="edit==='deleted'">
                        {{ arr[1] }}
                        <span class="icon-arrow-circle-right submission-diff-change-icon"></span>
                        <span class="empty-data">empty</span>
                      </span>
                      <span v-else>
                        <span class="empty-data">empty</span>
                        <span class="icon-arrow-circle-right submission-diff-change-icon"></span>
                        {{ arr[1] }}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </span>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SubmissionDiffrow',
  filters: {
    truncate(text, length, suffix) {
      if (text.length > length) {
        return text.substring(0, length) + suffix;
      }
      return text;
    }
  },
  props: {
    entry: {
      type: Object,
      required: true
    }
  },
  computed: {
    hidden() {
      return (this.entry.path[this.entry.path.length - 1] === 'instanceID' || this.entry.path[this.entry.path.length - 1] === 'deprecatedID');
    },
    editCaption() {
      if (this.edit === 'added' || this.edit === 'addedNode') {
        return this.$t('added');
      }
      if (this.edit === 'deleted' || this.edit === 'deletedNode') {
        return this.$t('deleted');
      }
      return '';
    },
    edit() {
      if (this.entry.old === null)
        if (typeof (this.entry.new) === 'object')
          return 'added';
      if (this.entry.new === null)
        if (typeof (this.entry.old) === 'object')
          return 'deleted';
      return 'changed';
    },
    captionColor() {
      if (this.edit === 'added' || this.edit === 'addedNode') {
        return 'green';
      }
      if (this.edit === 'deleted' || this.edit === 'deletedNode') {
        return 'red';
      }
      return 'black';
    }
  },
  methods: {
    recursivelyUnpack(node, prefix = []) {
      let changes = [];
      // eslint-disable-next-line guard-for-in
      for (const k in node) {
        const path = prefix.concat(k);
        if (Array.isArray(node)) {
          path.pop();
          path.push([prefix[prefix.length - 1], k]);
        }
        if (typeof (node[k]) === 'object') {
          changes = changes.concat(this.recursivelyUnpack(node[k], path));
        } else {
          changes.push([path, node[k]]);
        }
      }
      return changes;
    },
    prettyPath(path, edit) {
      const newPath = [];
      for (const key of path) {
        if (Array.isArray(key)) {
          const number = +key[1] + 1;
          newPath.push(`${key[0]} #${number}`);
        } else {
          newPath.push(key);
        }
      }
      if (edit === 'changed') {
        // remove last part of path to show in bold below
        newPath.pop();
      }
      return newPath.join(' › ');
    },
    changedField(path, editKind) {
      if (editKind === 'changed') {
        return path[path.length - 1];
      }
      return null;
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

.submission-diff-row {
  border-bottom: 1px solid #ddd;
  padding: 10px;
}

.submission-diff-row-inner {
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
  margin-bottom: 10px;
  margin-left: 20px;
}

.diff-path, .diff-field, .diff-edit-caption, .inner-diff-field {
  font-family: $font-family-monospace;
}

.diff-path {
  font-size: 10pt;
  overflow-wrap: unset;
  white-space: nowrap;
  color: #333;
}

.outer-diff-path {
  padding-bottom: 10px;
}

.diff-field, .inner-diff-field {
  font-size: 13pt;
  color: black;
  overflow: hidden;
  margin-right: 20px;
  text-overflow: ellipsis;
}

.diff-field, .diff-edit-caption {
  width: 150px;
  padding-top: 2px;
}

.inner-diff-field {
  width: 150px;
}

.diff-edit-caption {
  font-size: 13pt;
  vertical-align: top;
}

.empty-data {
  font-size: 13pt;
  background-color: #bbb;
  color: white;
  padding: 5px;
  margin: 5px;
  border-radius: 2px;
}

.diff-data {
  width: 100%;
  font-size: 13pt;
}

.submission-diff-change-icon {
  color: #888;
  padding: 5px;
}

</style>

<i18n lang="json5">
{
  "en": {
    // The description of how a specific field in a form submission changed
    "editCaption": {
      "added": "added",
      "deleted": "deleted",
      "changed": "changed"
    }
  }
}
</i18n>
