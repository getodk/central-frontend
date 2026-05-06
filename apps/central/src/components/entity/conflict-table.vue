<!--
Copyright 2023 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="entity-conflict-table" ref="el">
    <p v-if="versions.length === 0" class="empty-table-message">
      {{ $t('noConflicts') }}
    </p>
    <table v-else ref="table" class="table">
      <thead>
        <tr>
          <th ref="firstHeader">
            <span aria-hidden="true">{{ $t('common.version') }}</span>
          </th>
          <th v-for="version of versions" ref="versionHeaders"
            :key="version.version">
            {{ $t('common.versionShort', version) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>
            <span class="dfn" v-tooltip.sr-only>{{ $t('basedOn.label') }}</span>
            <span class="sr-only">&nbsp;{{ $t('basedOn.description') }}</span>
          </th>
          <td v-for="{ version, baseVersion } of versions" :key="version">
            {{ baseVersion == null ? '' : $t('common.versionShort', { version: baseVersion }) }}
          </td>
        </tr>
        <tr>
          <th>
            <span class="dfn" v-tooltip.sr-only>{{ $t('source.label') }}</span>
            <span class="sr-only">&nbsp;{{ $t('source.description') }}</span>
          </th>
          <td v-for="version of versions" :key="version.version" v-tooltip.text>
            <entity-version-link :uuid="uuid" :version="version"
              :target="linkTarget"/>
          </td>
        </tr>
        <tr v-if="summary.allReceived.has('label')">
          <th class="label-header">{{ $t('entity.label') }}</th>
          <td v-for="{ version, label, baseDiff } of versions" :key="version"
            :class="version === 1 || baseDiff.has('label') ? null : 'unchanged'"
            v-tooltip.text>
            {{ label }}
          </td>
        </tr>
        <tr v-for="name of propertyNames" :key="name">
          <th class="property-name" v-tooltip.text>{{ name }}</th>
          <td v-for="{ version, data, baseDiff } of versions" :key="version"
            :class="version === 1 || baseDiff.has(name) ? null : 'unchanged'"
            v-tooltip.text>
            {{ data[name] }}
          </td>
        </tr>
        <tr id="entity-conflict-table-status-row">
          <th>{{ $t('common.status') }}</th>
          <td v-for="version of versions" :key="version.version">
            <template v-if="version.version < lastGoodVersion">
              <span class="icon-history" v-tooltip.sr-only></span>
              <span class="sr-only">{{ $t('status.historical') }}</span>
            </template>
            <template v-else-if="version.lastGoodVersion">
              <span class="icon-check-circle" v-tooltip.sr-only></span>
              <span class="sr-only">{{ $t('status.lastGoodVersion') }}</span>
            </template>
            <template v-else-if="version.conflict === 'soft'">
              <span class="icon-question-circle" v-tooltip.sr-only></span>
              <span class="sr-only">{{ $t('status.softConflict') }}</span>
            </template>
            <template v-else-if="version.conflict === 'hard'">
              <span class="icon-warning" v-tooltip.sr-only></span>
              <span class="sr-only">{{ $t('status.hardConflict') }}</span>
            </template>
          </td>
        </tr>
        <tr v-if="branches.size !== 0" id="entity-conflict-table-branch-row">
          <th></th>
          <template v-for="version of versions" :key="version.version">
            <td v-if="!branches.has(version.branch)"></td>
            <td v-else-if="version === version.branch.first"
              :colspan="version.branch.length">
              <div v-tooltip.text>{{ $t('branch') }}</div>
            </td>
          </template>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { clamp, last } from 'ramda';
import { computed, onMounted, ref } from 'vue';

import EntityVersionLink from './version-link.vue';

import useEventListener from '../../composables/event-listener';
import { px } from '../../util/dom';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'EntityConflictTable'
});
const props = defineProps({
  uuid: {
    type: String,
    required: true
  },
  versions: {
    type: Array,
    required: true
  },
  linkTarget: String
});

// Iterate over all versions just once.
const summary = computed(() => {
  let lastGoodVersion;
  // The keys of dataReceived from each unresolved conflict
  const allReceived = new Set();
  // The offline branches to show in the table
  const branches = new Set();
  for (const [i, version] of props.versions.entries()) {
    if (version.lastGoodVersion) lastGoodVersion = version.version;

    if (version.conflict != null && !version.resolved) {
      for (const name of Object.keys(version.dataReceived))
        allReceived.add(name);
    }

    const { branch } = version;
    if (branch != null && version === branch.first && branch.length !== 1 &&
      // The versions from the branch must all be contiguous. It's OK if they're
      // not contiguous with the trunk version.
      branch.last.version === branch.first.version + branch.length - 1) {
      // We only show the branch if all the versions from the branch are shown
      // in the table. Otherwise, it may be unclear how long the branch was and
      // that there were other versions that were part of it. lastIndex is the
      // expected index of the last version from the branch if all the versions
      // from the branch are shown.
      const lastIndex = i + branch.length - 1;
      if (lastIndex < props.versions.length &&
        props.versions[lastIndex] === branch.last)
        branches.add(branch);
    }
  }
  return { lastGoodVersion, allReceived, branches };
});
const lastGoodVersion = computed(() => summary.value.lastGoodVersion);
const branches = computed(() => summary.value.branches);

// Property names
// The component assumes that this data will exist when the component is
// created.
const { dataset } = useRequestData();
const propertyNames = computed(() => {
  const result = [];
  const { allReceived } = summary.value;
  for (const { name } of dataset.properties) {
    if (allReceived.has(name)) result.push(name);
  }

  // Check for properties that are in allReceived but not dataset.properties.
  const expectedCount = allReceived.has('label')
    ? allReceived.size - 1
    : allReceived.size;
  if (result.length !== expectedCount) {
    const propertySet = new Set(dataset.properties);
    for (const name of allReceived) {
      if (name !== 'label' && !propertySet.has(name)) result.push(name);
    }
  }

  return result;
});

// Resize columns using a strategy similar to useColumnGrow().
const el = ref(null);
const table = ref(null);
const firstHeader = ref(null);
const versionHeaders = ref([]);
const minWidth = 50;
const maxWidth = 250;
const clampWidth = clamp(minWidth, maxWidth);
const resize = () => {
  if (props.versions.length === 0) return;
  const containerWidth = el.value.getBoundingClientRect().width;
  if (containerWidth === 0) return;

  // Undo previous resizing.
  firstHeader.value.style.width = '';
  for (const header of versionHeaders.value)
    header.style.width = '';

  // This makes the width of each column equal to its content width. After
  // getting those content widths and setting the new column widths, we will
  // remove this style.
  table.value.style.width = 'auto';

  // Resize the first column.
  const firstHeaderWidth = clampWidth(firstHeader.value.getBoundingClientRect().width);
  firstHeader.value.style.width = px(firstHeaderWidth);

  // Resize the version columns, giving each column the same width. Keep the
  // column width between the min width and the maximum content width, but
  // otherwise use the remaining width of the container.
  const maxVersionWidth = clampWidth(versionHeaders.value.reduce(
    (acc, header) => Math.max(acc, header.getBoundingClientRect().width),
    0
  ));
  const versionWidth = clamp(
    minWidth,
    maxVersionWidth,
    (containerWidth - firstHeaderWidth) / props.versions.length
  );
  const versionWidthPx = px(versionWidth);
  for (const header of versionHeaders.value)
    header.style.width = versionWidthPx;

  // Stretch the last column if there's leftover width in the container.
  if (containerWidth > firstHeaderWidth + props.versions.length * versionWidth) {
    table.value.style.width = '100%';
    last(versionHeaders.value).style.width = '';
  } else {
    table.value.style.width = '';
  }
};
onMounted(resize);
useEventListener(window, 'resize', resize);
defineExpose({ resize });
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#entity-conflict-table {
  overflow-x: auto;

  p, table { margin-bottom: 0; }
  table { table-layout: fixed; }

  thead th { font-size: 14px; }
  th:first-child { text-align: right; }

  th, td { @include text-overflow-ellipsis; }
  td { border-left: 1px solid #bbb; }

  tbody tr:nth-child(n + 2) {
    th, td {
      padding-bottom: 12px;
      padding-top: 12px;
    }
  }

  .label-header, .property-name {
    color: $color-danger;
    font-weight: normal;
  }
  .property-name { font-family: $font-family-monospace; }

  .unchanged {
    color: #888;

    font-style: italic;
    &:lang(ja), &:lang(zh) { font-style: normal; }
  }

  [class^="icon-"] {
    font-size: 16px;
    vertical-align: -2px;
  }
  .icon-history { color: #888; }
  .icon-check-circle { color: $color-success; }
  .icon-question-circle { color: $color-warning-dark; }
  .icon-warning { color: $color-danger-dark; }
}

#entity-conflict-table tbody tr {
  background-color: $background-color-feed-entry;
}
#entity-conflict-table tbody tr:first-child,
#entity-conflict-table tr:nth-child(2),
#entity-conflict-table-status-row,
#entity-conflict-table-branch-row {
  background-color: #f4f4f4;
}

#entity-conflict-table #entity-conflict-table-status-row {
  th, td { padding-bottom: 15px; }
  &:nth-last-child(2) {
    th, td { padding-bottom: 0; }
  }
}

#entity-conflict-table-branch-row {
  th, td {
    border-top: none;

    // Increase selector specificity in order to override styles above.
    #entity-conflict-table & {
      padding-bottom: 4px;
      padding-top: 4px;
    }
  }

  td > div {
    @include text-overflow-ellipsis;
    background-color: #888;
    border-radius: 6px;
    color: #fff;
    font-size: 12px;
    padding: 2px 4px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is shown if all conflicts between versions have been resolved for an
    // Entity.
    "noConflicts": "There are no conflicts to show.",
    "basedOn": {
      // "Based on" as in "the version of the Entity that this version is based
      // on". That version is known as the "base version". It is the version of
      // the Entity that the author saw when they made their changes.
      "label": "Based on",
      "description": "The version of this Entity that the author saw when they made their changes"
    },
    "source": {
      "label": "Source",
      "description": "The update that generated this version"
    },
    "status": {
      "historical": "This historical version is included because a recent parallel update was made based on this version of this Entity.",
      "lastGoodVersion": "This is the most recent version in good agreement. After this update, potentially conflicting updates have been made in parallel.",
      "softConflict": "This version may have been made based on old data.",
      "hardConflict": "This version was made in parallel with other updates, some of which attempt to write to the same properties as this update."
    },
    // A series of updates that were made offline
    "branch": "Offline update chain"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "noConflicts": "Nejsou žádné konflikty k zobrazení.",
    "source": {
      "label": "Zdroj",
      "description": "Aktualizace, která vygenerovala tuto verzi"
    },
    "status": {
      "historical": "Tato historická verze je zahrnuta, protože nedávná paralelní aktualizace byla provedena na základě této verze této Entity.",
      "lastGoodVersion": "Toto je nejnovější verze v dobré shodě. Po této aktualizaci byly provedeny potenciálně konfliktní aktualizace paralelně.",
      "softConflict": "Tato verze může být vytvořena na základě starých dat.",
      "hardConflict": "Tato verze byla vytvořena paralelně s dalšími aktualizacemi, z nichž některé se snaží zapisovat do stejných vlastností jako tato aktualizace."
    }
  },
  "de": {
    "noConflicts": "Es gibt keine Konflikte anzuzeigen.",
    "basedOn": {
      "label": "Basierend auf",
      "description": "Die Version dieses Objekts, die der Autor gesehen hat, als er seine Änderungen vorgenommen hat."
    },
    "source": {
      "label": "Quelle",
      "description": "Die Aktualisierung, die diese Version generiert hat."
    },
    "status": {
      "historical": "Diese historische Version ist enthalten, weil ein kürzlich durchgeführtes paralleles Update auf dieser Version dieses Objekts basierte.",
      "lastGoodVersion": "Dies ist die aktuellste Version in guter Übereinstimmung. Nach diesem Update wurden potenziell widersprüchliche Updates parallel durchgeführt.",
      "softConflict": "Diese Version könnte auf alten Daten basieren.",
      "hardConflict": "Diese Version wurde parallel zu anderen Updates erstellt, von denen einige versuchen, auf dieselben Eigenschaften wie dieses Update zu schreiben."
    },
    "branch": "Offline-Aktualisierungskette"
  },
  "es": {
    "noConflicts": "No hay conflictos para mostrar.",
    "basedOn": {
      "label": "Basado en",
      "description": "La versión de esta Entidad que el autor vio cuando hizo sus cambios"
    },
    "source": {
      "label": "Fuente",
      "description": "La actualización que generó esta versión"
    },
    "status": {
      "historical": "Esta versión histórica se incluye porque se realizó una actualización paralela reciente basada en esta versión de esta Entidad.",
      "lastGoodVersion": "Esta es la versión más reciente en buen acuerdo. Después de esta actualización, se han realizado actualizaciones potencialmente conflictivas en paralelo.",
      "softConflict": "Esta versión puede haber sido creada en base a datos antiguos.",
      "hardConflict": "Esta versión se realizó en paralelo con otras actualizaciones, algunas de las cuales intentan escribir en las mismas propiedades que esta actualización."
    },
    "branch": "Cadena de actualización offline"
  },
  "fr": {
    "noConflicts": "Il n'y a pas de conflit à afficher.",
    "basedOn": {
      "label": "Basé sur",
      "description": "La version de cette Entité vue par les auteurs quand ils ont fait leurs changements."
    },
    "source": {
      "label": "Source",
      "description": "La mise à jour qui a généré cette version"
    },
    "status": {
      "historical": "Cette version historique est inclues parce qu'une récente mise à jour parallèle a été faite sur la base de cette version de l'Entité.",
      "lastGoodVersion": "Ceci est la version cohérente la plus récente. Après cette mise à jour, des mises à jour potentiellement contradictoires ont été effectuées en parallèle.",
      "softConflict": "Cette version pourrait avoir été faite sur la base d'une vieille donnée.",
      "hardConflict": "Cette version a été faite en parallèle avec d'autres, certaines tentent d'écrire les mêmes propriétés que cette mise à jour."
    },
    "branch": "Chaîne de mise à jour hors ligne"
  },
  "it": {
    "noConflicts": "Non ci sono conflitti da mostrare.",
    "basedOn": {
      "label": "Basato su",
      "description": "La versione di questa Entità che l'autore ha visto quando ha apportato le sue modifiche"
    },
    "source": {
      "label": "Sorgente",
      "description": "L'aggiornamento che ha generato questa versione"
    },
    "status": {
      "historical": "Questa versione storica è inclusa perché è stata effettuata un'aggiornamento parallelo recente basato su questa versione di questa Entità.",
      "lastGoodVersion": "Questa è la versione più recente in buon accordo. Dopo questo aggiornamento, sono state effettuate aggiornamenti potenzialmente in contrasto in parallelo.",
      "softConflict": "Questa versione potrebbe essere stata creata basandosi su dati vecchi.",
      "hardConflict": "Questa versione è stata realizzata parallelamente ad altri aggiornamenti, alcuni dei quali cercano di scrivere sulle stesse proprietà di questo aggiornamento."
    },
    "branch": "Catena di aggiornamento offline"
  },
  "pt": {
    "noConflicts": "Não há conflitos para mostrar.",
    "basedOn": {
      "label": "Com base em",
      "description": "A versão desta Entidade que o autor viu quando fez suas alterações"
    },
    "source": {
      "label": "Fonte",
      "description": "A atualização que gerou esta versão"
    },
    "status": {
      "historical": "Esta versão histórica está incluída porque uma atualização paralela recente foi feita com base nesta versão desta Entidade.",
      "lastGoodVersion": "Esta é a versão consensual mais recente. Após essa atualização, atualizações potencialmente conflitantes foram feitas em paralelo.",
      "softConflict": "Esta versão pode ter sido feita com base em dados antigos.",
      "hardConflict": "Esta versão foi feita em paralelo com outras atualizações, algumas das quais tentam gravar nas mesmas propriedades desta atualização."
    },
    "branch": "Cadeia de atualização offline"
  },
  "zh": {
    "noConflicts": "没有可显示的冲突。",
    "basedOn": {
      "label": "基于",
      "description": "作者在进行修改时所看到的该实体版本"
    },
    "source": {
      "label": "来源",
      "description": "产生此版本的更新"
    },
    "status": {
      "historical": "包含此历史版本，是因为最近的一次同步是更新基于该实体的此版本。",
      "lastGoodVersion": "这是最新且一致的版本。在此更新之后，可能存在冲突的同步更新已被创建。",
      "softConflict": "此版本可能基于过期的数据创建。",
      "hardConflict": "这个版本是与其他更新并行制作的，其中某些更新尝试写入与本更新相同的属性。"
    },
    "branch": "离线更新链"
  },
  "zh-Hant": {
    "noConflicts": "沒有可顯示的衝突。",
    "basedOn": {
      "label": "基於",
      "description": "作者在進行更改時看到的該實體的版本"
    },
    "source": {
      "label": "來源",
      "description": "產生此版本的更新"
    },
    "status": {
      "historical": "包含此歷史版本是因為最近基於該實體的此版本進行了平行更新。",
      "lastGoodVersion": "這是吻合良好的最新版本。在此更新之後，同時進行了可能存在衝突的更新。",
      "softConflict": "這個版本可能是根據舊數據製作的。",
      "hardConflict": "此版本是與其他更新並行進行的，其中一些更新嘗試寫入與此更新相同的屬性。"
    },
    "branch": "離線更新鏈"
  }
}
</i18n>
