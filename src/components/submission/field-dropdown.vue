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
<template>
  <div id="submission-field-dropdown" class="form-group">
    <!-- Specifying @mousedown.prevent so that clicking the select element does
    not show a menu with the placeholder option. This approach seems to work
    across browsers. -->
    <select id="submission-field-dropdown-toggle" ref="select"
      class="form-control" data-toggle="dropdown" role="button"
      aria-haspopup="true" aria-expanded="false"
      :aria-label="$t('field.columns')" @keydown="toggleAfterEnter"
      @mousedown.prevent>
      <option value="">{{ placeholder }}</option>
    </select>
    <span class="form-label">{{ $t('field.columns') }}</span>
    <!-- Specifying @click.stop so that clicking the .dropdown-menu does not
    hide it. -->
    <ul class="dropdown-menu" aria-labelledby="submission-field-dropdown-toggle"
      @click.stop>
      <li class="search">
        <div class="form-group">
          <input ref="search" v-model="search" class="form-control"
            :placeholder="$t('field.search')" :aria-label="$t('field.search')"
            autocomplete="off">
          <button v-show="search !== ''" type="button" class="close"
            :aria-label="$t('action.clear')" @click="clearSearch">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
      </li>
      <li class="toggle-all">
        <i18n tag="div" path="action.select.full">
          <template #all>
            <a href="#" :class="{ disabled: disablesSelectAll }"
              :title="disablesSelectAll ? $t('disabled') : null" role="button"
              @click.prevent="selectAll">{{ $t('action.select.all') }}</a>
          </template>
          <template #none>
            <a href="#" role="button" @click.prevent="selectNone">{{ $t('action.select.none') }}</a>
          </template>
        </i18n>
      </li>
      <li>
        <ul>
          <li v-for="field of selectableFields" :key="field.path"
            :class="{ 'search-match': matchesSearch(field) }">
            <div class="checkbox"
              :class="{ disabled: disablesCheckbox(field) }">
              <label :title="disablesCheckbox(field) ? $t('disabled') : null">
                <input type="checkbox" :checked="checked[field.path]"
                  :disabled="disablesCheckbox(field)" @change="toggle(field)">
                <span :title="!disablesCheckbox(field) ? field.header() : null">{{ field.name }}</span>
              </label>
            </div>
          </li>
          <li>{{ $t('common.noResults') }}</li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
import { equals } from 'ramda';
import { mapGetters } from 'vuex';

// This constant is also used in the `disabled` message.
const maxCheckedCount = 100;

export default {
  name: 'SubmissionFieldDropdown',
  props: {
    value: {
      type: Array,
      required: true
    }
  },
  data() {
    const checked = {};
    for (const field of this.$store.getters.selectableFields)
      checked[field.path] = false;
    for (const field of this.value)
      checked[field.path] = true;

    return {
      checked,
      checkedCount: this.value.length,
      search: '',
      // jQuery wrappers
      wrappers: {
        parent: null,
        toggle: null
      }
    };
  },
  computed: {
    ...mapGetters(['selectableFields']),
    placeholder() {
      return this.$t('placeholder', {
        selected: this.$n(this.value.length, 'default'),
        total: this.$n(this.selectableFields.length, 'default')
      });
    },
    searchToLowerCase() {
      return this.search.toLowerCase();
    },
    disablesSelectAll() {
      if (this.checkedCount === maxCheckedCount) return true;
      const countIfSelectAll = this.selectableFields.reduce(
        (count, field) => (!this.checked[field.path] && this.matchesSearch(field)
          ? count + 1
          : count),
        this.checkedCount
      );
      return countIfSelectAll > maxCheckedCount;
    }
  },
  watch: {
    value(value) {
      for (const field of this.selectableFields)
        this.checked[field.path] = false;
      for (const field of value)
        this.checked[field.path] = true;

      this.checkedCount = value.length;
    }
  },
  mounted() {
    this.wrappers.parent = $(this.$el).on('hidden.bs.dropdown', this.afterHide);
    this.wrappers.toggle = $(this.$refs.select);
  },
  beforeDestroy() {
    this.wrappers.parent.off('hidden.bs.dropdown');
  },
  methods: {
    toggleAfterEnter(event) {
      if (event.key === 'Enter') this.wrappers.toggle.dropdown('toggle');
    },
    clearSearch() {
      this.search = '';
      this.$refs.search.focus();
    },
    matchesSearch(field) {
      return this.search === '' ||
        field.header().toLowerCase().includes(this.searchToLowerCase);
    },
    selectAll() {
      if (this.disablesSelectAll) return;
      for (const field of this.selectableFields) {
        if (!this.checked[field.path] && this.matchesSearch(field)) {
          this.checked[field.path] = true;
          this.checkedCount += 1;
        }
      }
    },
    selectNone() {
      for (const field of this.selectableFields) {
        if (this.checked[field.path] && this.matchesSearch(field)) {
          this.checked[field.path] = false;
          this.checkedCount -= 1;
        }
      }
    },
    disablesCheckbox(field) {
      return this.checkedCount === maxCheckedCount && !this.checked[field.path];
    },
    toggle(field) {
      const fieldWasChecked = this.checked[field.path];
      this.checked[field.path] = !fieldWasChecked;
      this.checkedCount += fieldWasChecked ? -1 : 1;
    },
    afterHide() {
      const newValue = this.selectableFields.filter(field =>
        this.checked[field.path]);
      if (!equals(newValue, this.value)) this.$emit('input', newValue);

      this.search = '';
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#submission-field-dropdown {
  select {
    background-color: #777;
    color: #fff;
    min-width: 111px;
  }

  $line-height: 1;
  .dropdown-menu {
    border-radius: 0;
    line-height: $line-height;
    margin-top: 0;
    padding-bottom: 0;
  }

  $hpadding: 9px;
  $vpadding: 6px;
  .search {
    padding: $vpadding $hpadding;

    // SubmissionFieldDropdown is inside a .form-inline.
    .form-group { display: block; }

    .form-control {
      background-color: #fff;
      display: block;
      font-size: $font-size-dropdown-menu;
      height: auto;
      line-height: $line-height;
      // padding-right for the .close button.
      padding: 0 16px 0 0;
      width: 100%;

      &, &:focus { border-bottom: none; }

      &::placeholder {
        color: #666;
        font-style: italic;
      }
    }

    .close {
      font-size: 18px;
      right: 0;
      top: -5px;
    }
  }

  .toggle-all { padding: #{0.5 * $vpadding} $hpadding $vpadding; }

  .dropdown-menu ul {
    background-color: $color-subpanel-background;
    font-size: 14px;
    list-style: none;
    max-height: 250px;
    overflow: visible auto;
    padding-bottom: 3px;
    padding-left: 0;
    padding-top: $vpadding;
    // Specifying a fixed width so that the width does not change during search.
    width: 275px;

    li {
      padding-left: $hpadding;
      padding-right: $hpadding;

      &:last-child {
        // 22px is the same as the other <li> elements.
        height: 22px;
        padding-top: 3px;
      }

      display: none;
      &:last-child { display: list-item; }
      &.search-match {
        display: list-item;
        ~ :last-child { display: none; }
      }
    }
  }

  .checkbox {
    display: block;
    label { @include text-overflow-ellipsis; }
  }

  input[type="checkbox"] {
    margin-top: 0;
    margin-right: 5px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the text of a dropdown that allows the user to select which
    // columns to display in a table. {selected} is the number of columns
    // selected; {total} is the total number of columns.
    "placeholder": "{selected} of {total}",
    "field": {
      // This is shown beneath text that indicates the number of columns that
      // the user has selected to display in a table. For example, that text may
      // read "10 of 100", where 10 is the number of columns selected, and 100
      // is the total number of columns.
      "columns": "Columns shown",
      "search": "Search columns…"
    },
    "disabled": "Cannot select more than 100 columns.",
    "action": {
      "select": {
        "full": "Select {all} / {none}",
        "all": "All",
        "none": "None"
      }
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "placeholder": "{selected} z {total}",
    "field": {
      "columns": "Zobrazené sloupce",
      "search": "Hledat sloupce…"
    },
    "disabled": "Nelze vybrat více než 100 sloupců.",
    "action": {
      "select": {
        "full": "Vybrat {all} / {none}",
        "all": "Vše",
        "none": "Nic"
      }
    }
  },
  "de": {
    "placeholder": "{selected} von {total}",
    "field": {
      "columns": "angezeigte Spalten",
      "search": "Spalten suchen..."
    },
    "disabled": "Mehr als 100 Spalten können nicht ausgewählt werden.",
    "action": {
      "select": {
        "full": "{all} / {none} auswählen",
        "all": "Alle",
        "none": "Keine"
      }
    }
  },
  "es": {
    "placeholder": "{selected} de {total}",
    "field": {
      "columns": "Se muestran las columnas",
      "search": "Buscar columnas…"
    },
    "disabled": "No se pueden seleccionar más de 100 columnas.",
    "action": {
      "select": {
        "full": "Seleccionar {all} / {none}",
        "all": "Todas",
        "none": "Ninguna"
      }
    }
  },
  "fr": {
    "placeholder": "{selected} sur {total}",
    "field": {
      "columns": "Colonnes affichées",
      "search": "Chercher des colonnes"
    },
    "disabled": "Impossible de sélectionner plus de 100 colonnes.",
    "action": {
      "select": {
        "full": "Sélectionner {all} / {none}",
        "all": "Tous/toutes",
        "none": "Aucun(e)"
      }
    }
  },
  "id": {
    "placeholder": "{selected} dari {total}",
    "field": {
      "columns": "Kolom terlihat",
      "search": "Mencari kolom..."
    },
    "disabled": "Tidak bisa memilih lebih dari 100 kolom.",
    "action": {
      "select": {
        "full": "Pilih {all} / {none}",
        "all": "Semua",
        "none": "Jangan Semua"
      }
    }
  },
  "ja": {
    "placeholder": "{total}列の内{selected}列",
    "field": {
      "columns": "表示された列",
      "search": "列を検索"
    },
    "disabled": "100以上の列は選択できません。",
    "action": {
      "select": {
        "full": "選択設定 {all}/{none}",
        "all": "全て",
        "none": "なし"
      }
    }
  }
}
</i18n>
