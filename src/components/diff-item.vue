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
  <div class="diff-item" :class="nestedClass">
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
        <div class="field-name" v-tooltip.text>
          {{ fieldName }}
        </div>
        <div class="old-to-new">
          <span v-if="old" class="data-old" v-tooltip.text>
            <slot :path="path" :parent-path="parentPath" :value="old" :is-old="true">{{ old }}</slot>
          </span>
          <span v-else class="data-empty">{{ $t('empty') }}</span>
          <span class="icon-arrow-circle-right"></span>
          <span v-if="newValue" class="data-new" v-tooltip.text>
            <slot :path="path" :parent-path="parentPath" :value="newValue" :is-old="false">{{ newValue }}</slot>
          </span>
          <span v-else class="data-empty">{{ $t('empty') }}</span>
        </div>
      </template>
      <template v-else>
        <div class="nested-change-type" :class="typeOfChange">
          {{ $t(`editCaption.${typeOfChange}`) }}
        </div>
        <div>
          <diff-item v-for="(change, index) in nestedDiffs" :key="index"
            v-slot="slotProps" v-bind="change" :parent-path="path">
            <slot v-bind="slotProps">{{ slotProps.value }}</slot>
          </diff-item>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { always, last } from 'ramda';

export default {
  name: 'DiffItem',
  props: {
    path: {
      type: Array,
      required: true
    },
    parentPath: {
      type: Array,
      default: always([])
    },
    old: null,
    new: null
  },
  computed: {
    isAtomicChange() {
      // Check whether the change is of a single field (atomic)
      // or if it is of a whole subtree being added or removed.
      // If one side is null (addition or deletion) and the remaining
      // side is an object, then it is NOT an atomic change.
      if (this.old == null && typeof (this.new) === 'object')
        return false;
      if (this.new == null && typeof (this.old) === 'object')
        return false;
      return true;
    },
    visiblePath() {
      // If the change is atomic, it will split the path into the field name
      // of the changed leaf node and the preceeding part of the path (which
      // could be empty for a short path).
      // Otherwise, it will show the whole path of the changed subtree.
      if (!this.isAtomicChange)
        return this.path;
      return this.path.slice(0, this.path.length - 1);
    },
    fieldName() {
      return last(this.path);
    },
    nestedClass() {
      return this.parentPath.length === 0 ? 'outer-item' : 'inner-item';
    },
    // Alias the `new` prop as newValue so that the prop can be accessed in the
    // template.
    newValue() {
      return this.new;
    },
    typeOfChange() {
      // Check which value is null (old or new) to determine the
      // type of change or edit.
      // This is only used for non-atomic (nested) changes so
      // it will always be one or the other.
      return (this.old == null ? 'added' : 'deleted');
    },
    nestedDiffs() {
      return this.flattenDiff(this.new || this.old, this.typeOfChange);
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
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/mixins';

.diff-item {
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
  // @transifexKey component.SubmissionDiffItem
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
    "empty": "vacío"
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
  "pt": {
    "editCaption": {
      "added": "(incluído)",
      "deleted": "(apagado)"
    },
    "empty": "vazio"
  },
  "sw": {
    "editCaption": {
      "added": "(imeongezwa)",
      "deleted": "(imefutwa)"
    },
    "empty": "tupu"
  },
  "zh": {
    "editCaption": {
      "added": "（已添加）",
      "deleted": "（已删除）"
    },
    "empty": "空"
  },
  "zh-Hant": {
    "editCaption": {
      "added": "(已增加)",
      "deleted": "(已刪除)"
    },
    "empty": "空的"
  }
}
</i18n>
