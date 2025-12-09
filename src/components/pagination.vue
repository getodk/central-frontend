<!--
Copyright 2024 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="pagination">
    <form class="form-inline">
      <button type="button" class="btn btn-link" :aria-label="$t('action.first')"
        :aria-disabled="page === 0" v-tooltip.aria-label
        @click="$emit('update:page', 0)">
        <span class="icon-angle-double-left"></span>
      </button>
      <button type="button" class="btn btn-link" :aria-label="$t('action.previous')"
        :aria-disabled="page === 0" v-tooltip.aria-label
        @click="$emit('update:page', page - 1)">
        <span class="icon-angle-left"></span>
      </button>
      <button type="button" class="btn btn-link" :aria-label="$t('action.next')"
        :aria-disabled="page === lastPage" v-tooltip.aria-label
        @click="$emit('update:page', page + 1)">
        <span class="icon-angle-right"></span>
      </button>
      <button type="button" class="btn btn-link" :aria-label="$t('action.last')"
        :aria-disabled="page === lastPage" v-tooltip.aria-label
        @click="$emit('update:page', lastPage)">
        <span class="icon-angle-double-right"></span>
      </button>
      <i18n-t tag="div" keypath="rows" :plural="sizeOfCurrentPage"
        class="form-group">
        <template #range>
          <!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
          <select v-if="lastPage > 0 && lastPage < 20" v-model="pageModel"
            class="form-control">
            <option v-for="[value, text] of pageOptions" :key="value" :value="value">
              {{ text }}
            </option>
          </select>
          <template v-else>{{ pageRange(page) }}</template>
        </template>
        <template #count>{{ $n(count, 'default') }}</template>
      </i18n-t>
      <label class="form-group">
        <select v-model="sizeModel" class="form-control">
          <option v-for="x of sizeOptions" :key="x" :value="x">
            {{ $n(x, 'default') }}
          </option>
        </select>
        <span>{{ $t('field.size') }}</span>
      </label>
      <spinner :state="spinner" inline/>
    </form>
  </div>
</template>

<script setup>
import { computed } from 'vue';

import Spinner from './spinner.vue';

import { useI18nUtils } from '../util/i18n';

const props = defineProps({
  count: {
    type: Number,
    required: true
  },
  page: {
    type: Number,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  sizeOptions: {
    type: Array,
    required: true
  },
  spinner: Boolean
});
const emit = defineEmits(['update:page', 'update:size']);

const lastPage = computed(() => Math.ceil(props.count / props.size) - 1);

const pageModel = computed({
  get: () => props.page,
  set: (value) => { emit('update:page', value); }
});
const { formatRange } = useI18nUtils();
// Returns the formatted range of rows shown on the specified page.
const pageRange = (page) => {
  const start = page * props.size + 1;
  const end = page < lastPage.value ? start + props.size - 1 : props.count;
  return formatRange(start, end);
};
const pageOptions = computed(() => {
  const result = new Array(lastPage.value + 1);
  for (let i = 0; i <= lastPage.value; i += 1) result[i] = [i, pageRange(i)];
  return result;
});
const sizeOfCurrentPage = computed(() => {
  if (props.page < lastPage.value) return props.size;
  const r = props.count % props.size;
  return r === 0 ? props.size : r;
});

const sizeModel = computed({
  get: () => props.size,
  set: (value) => {
    emit('update:size', value);
    emit('update:page', 0);
  }
});
</script>

<i18n lang="json5">
{
  "en": {
    "action": {
      "first": "First page",
      "previous": "Previous page",
      "next": "Next page",
      "last": "Last page"
    },
    // {range} is a range of row numbers, for example, 1-5. {count} is the total
    // number of rows. The string will be pluralized based on the number of rows
    // in the range.
    "rows": "Row {range} of {count} | Rows {range} of {count}",
    "field": {
      // This is shown next to a field to select the number of rows to show on
      // each page.
      "size": "per page"
    }
  }
}
</i18n>

<style lang="scss">
@import '../assets/scss/mixins';

.pagination {
  align-items: center;
  display: flex;

  .form-inline, .form-control { font-size: 12px; }

  .btn {
    &:not([aria-disabled="true"]) {
      &, &:hover { color: $color-action-background; }
    }

    padding: 2px 6px;
    &:nth-child(1) { padding-left: 0; }
    &:nth-child(4) { padding-right: 0; }
  }

  [class^="icon-"] {
    font-size: 15px;

    &:first-child { margin-right: 0; }
  }

  .form-inline {
    @include form-control-background;
    width: 100%;
    align-items: center;
    display: flex;
    border-radius: 5px;
    margin-bottom: 0;
    padding: 6px 10px;
  }

  .form-control {
    height: auto;
    padding: 2px;
    padding-right: 0;
    vertical-align: baseline;
  }
  .form-group .form-control { background-color: #fff; }

  .btn + .form-group {
    margin-left: 18px;

    .form-control {
      margin-left: 1px;
      margin-right: 1px;
    }
  }

  .form-group + .form-group {
    margin-left: 21px;

    .form-control { margin-right: 5px; }
  }

  .spinner { margin-left: 7px; }

  .table ~ & {
    margin-top: -$margin-bottom-table;

    .form-inline { margin-left: $padding-left-table-data; }
  }
}
</style>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "action": {
      "first": "Erste Seite",
      "previous": "Vorherige Seite",
      "next": "Nächste Seite",
      "last": "Letzte Seite"
    },
    "rows": "Reihe {range} von {count} | Reihen {range} von {count}",
    "field": {
      "size": "pro Seite"
    }
  },
  "es": {
    "action": {
      "first": "Primera página",
      "previous": "Pagina anterior",
      "next": "Pagina siguiente",
      "last": "Última página"
    },
    "rows": "Fila {range} de {count} | Filas {range} de {count} | Filas {range} de {count}",
    "field": {
      "size": "por página"
    }
  },
  "fr": {
    "action": {
      "first": "Première page",
      "previous": "Page précédente",
      "next": "Prochaine page",
      "last": "Dernière page"
    },
    "rows": "Ligne {range} de {count} | Lignes {range} de {count} | Lignes {range} de {count}",
    "field": {
      "size": "par page"
    }
  },
  "it": {
    "action": {
      "first": "Prima pagina",
      "previous": "Pagina precedente",
      "next": "Prossima pagina",
      "last": "Ultima pagina"
    },
    "rows": "Riga {range} di {count} | Righe {range} di {count} | Righe {range} di {count}",
    "field": {
      "size": "per pagina"
    }
  },
  "pt": {
    "action": {
      "first": "Primeira página",
      "previous": "Página anterior",
      "next": "Próxima página",
      "last": "Última página"
    },
    "rows": "Linha {range} de {count} | Linhas {range} de {count} | Linhas {range} de {count}",
    "field": {
      "size": "por página"
    }
  },
  "zh": {
    "action": {
      "first": "首页",
      "previous": "上一页",
      "next": "下一页",
      "last": "末页"
    },
    "rows": "第{range}行/共{count}行",
    "field": {
      "size": "每页显示"
    }
  },
  "zh-Hant": {
    "action": {
      "first": "第一頁",
      "previous": "上一頁",
      "next": "下一頁",
      "last": "最後一頁"
    },
    "rows": "第 {range} 行，共 {count} 行",
    "field": {
      "size": "每頁"
    }
  }
}
</i18n>
