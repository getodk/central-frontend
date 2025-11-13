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
  <modal id="entity-resolve" :state="state" :hideable="!awaitingResponse"
    size="large" backdrop @hide="$emit('hide')">
    <template #title>{{ $t('title', entity) }}</template>
    <template #body>
      <div v-if="!success">
        <div class="modal-introduction">
          <p>{{ $t('instructions[0]', entity) }}</p>
          <p v-if="canUpdate">
            {{ $t('instructions[1]', { markAsResolved: $t('action.markAsResolved') }) }}
          </p>
        </div>

        <div v-show="tableShown" id="entity-resolve-table-container">
          <loading :state="entityVersions.awaitingResponse"/>
          <entity-conflict-table v-if="entityVersions.dataExists" ref="table"
            :uuid="entity.__id" :versions="entityVersions.data"
            link-target="_blank"/>
        </div>
        <div id="entity-resolve-table-toggle">
          <a href="#" role="button" @click.prevent="toggleTable">
            <template v-if="!tableShown">
              <span class="icon-angle-down"></span>
              <span>{{ $t('action.table.show') }}</span>
            </template>
            <template v-else>
              <span class="icon-angle-up"></span>
              <span>{{ $t('action.table.hide') }}</span>
            </template>
          </a>
        </div>

        <router-link class="btn btn-default more-details" :to="entityPath(projectId, datasetName, entity?.__id)"
          :class="{ disabled: awaitingResponse }" target="_blank">
          <span class="icon-external-link-square"></span>{{ $t('action.seeMoreDetails') }}
        </router-link>
        <template v-if="canUpdate">
          <button type="button" class="btn btn-default edit-entity" :aria-disabled="awaitingResponse" @click="$emit('hide', true)">
            <span class="icon-pencil"></span>{{ $t('action.editEntity') }}
          </button>
          <button type="button" class="btn btn-default mark-as-resolved" :aria-disabled="awaitingResponse" @click="markAsResolve">
            <span class="icon-check"></span>{{ $t('action.markAsResolved') }} <spinner :state="awaitingResponse"/>
          </button>
        </template>
      </div>
      <div v-else class="success-msg">
        <span class="icon-check-circle success"></span> {{ $t('successMessage') }}
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-primary" :aria-disabled="awaitingResponse" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, inject, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import EntityConflictTable from './conflict-table.vue';
import Loading from '../loading.vue';
import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useEntityVersions from '../../request-data/entity-versions';
import useRequest from '../../composables/request';
import useRoutes from '../../composables/routes';
import { useRequestData } from '../../request-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';

defineOptions({
  name: 'EntityResolve'
});
const props = defineProps({
  state: Boolean,
  entity: Object
});
const emit = defineEmits(['hide', 'success']);

// The component does not assume that this data will exist when the component is
// created.
const { project } = useRequestData();
const entityVersions = useEntityVersions();

const canUpdate = computed(() =>
  project.dataExists && project.permits('entity.update'));

// Conflict summary table
const projectId = inject('projectId');
const datasetName = inject('datasetName');
const alert = inject('alert');
const { t } = useI18n();
const requestEntityVersions = () => {
  entityVersions.request({
    url: apiPaths.entityVersions(projectId, datasetName, props.entity.__id, { relevantToConflict: true }),
    extended: true
  })
    .then(() => {
      if (entityVersions.length === 0) alert.danger(t('problem.400_32'));
    })
    .catch(noop);
};
const tableShown = ref(false);
const table = ref(null);
const toggleTable = () => {
  tableShown.value = !tableShown.value;
  if (tableShown.value) nextTick(() => { table.value.resize(); });
};

const { entityPath } = useRoutes();

// "Mark as resolved" button
const { request, awaitingResponse } = useRequest();
const success = ref(false);
const markAsResolve = () => {
  const { entity } = props;
  const url = apiPaths.entity(projectId, datasetName, entity.__id, {
    resolve: true,
    baseVersion: entity.__system.version
  });
  request.patch(
    url,
    null,
    {
      problemToAlert: ({ code }) => {
        if (code === 400.32) return t('problem.400_32');
        if (code === 409.15) return t('problem.409_15');
        return null;
      }
    }
  )
    .then(response => {
      // It is the responsibility of the parent component to patch the entity.
      emit('success', response.data);
      success.value = true;
    })
    .catch(noop);
};

// props.entity is changed after the user clicks the button in the table row,
// when the modal is shown. It is also changed after the user clicks the
// "Edit Entity" button in the modal, then uses EntityUpdate to update the
// entity. props.entity is changed to `null` when the modal is completely
// hidden (not just when switching to EntityUpdate).
watch(() => props.entity, (entity) => {
  if (entity != null) {
    requestEntityVersions();
  } else {
    entityVersions.reset();
    tableShown.value = false;
    success.value = false;
  }
});
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#entity-resolve {
  .modal-dialog { margin-top: 15vh; }
  .modal-introduction { margin-bottom: 12px; }

  .btn + .btn {
    margin-left: 10px;
  }
  .mark-as-resolved { border: 1px solid $color-success; }
  .icon-check { color: $color-success; }

  .success {
    font-size: 30px;
    color: $color-success;
    vertical-align: -7px;
    margin-right: 10px;
  }
}

#entity-resolve-table-container {
  margin-bottom: 6px;
  margin-left: -$padding-modal-body;
  margin-right: -$padding-modal-body;
  // If the height of the modal content other than the table is no more than
  // 365px, this allows the table to push the modal to 75vh tall. After that,
  // the table container will scroll.
  max-height: max(calc(75vh - 365px), 175px);
  overflow-y: auto;
  padding-top: 3px;
}
#entity-resolve #entity-conflict-table {
  tbody tr { background-color: transparent; }
  th:first-child { padding-left: $padding-modal-body; }
  .empty-table-message { margin-left: $padding-modal-body; }
}
#entity-resolve-table-toggle { margin-bottom: 15px; }
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up. {label} is the label of an
    // Entity.
    "title": "Parallel updates to “{label}”",
    "instructions": [
      "Updates were made to “{label}” in parallel. This means changes may be in conflict with each other, as they were authored against older data than they were eventually applied to by Central.",
      "Review the updates, make any edits you need to, and if you are sure this Entity data is correct press “Mark as resolved” to clear this warning message."
    ],
    "action": {
      "table": {
        "show": "Show summary table",
        "hide": "Hide summary table"
      },
      "seeMoreDetails": "See more details",
      "editEntity": "Edit Entity",
      "markAsResolved": "Mark as resolved"
    },
    "successMessage": "The conflict warning has been cleared from the Entity.",
    "problem": {
      "400_32": "Another user has already marked the conflict as resolved. Please refresh to see the updated data.",
      // @transifexKey component.EntityUpdate.problem.409_15
      "409_15": "Data has been modified by another user. Please refresh to see the updated data."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "table": {
        "show": "Zobrazit souhrnnou tabulku",
        "hide": "Skrýt souhrnnou tabulku"
      },
      "seeMoreDetails": "Více podrobností",
      "editEntity": "Upravit entitu",
      "markAsResolved": "Označit jako vyřešeno"
    },
    "successMessage": "Varování konfliktu bylo odstraněno z Entity.",
    "problem": {
      "400_32": "Jiný uživatel již označil konflikt jako vyřešený. Aktualizujte prosím, abyste viděli aktualizovaná data.",
      "409_15": "Data byla upravena jiným uživatelem. Aktualizujte prosím stránku, abyste viděli aktualizovaná data."
    }
  },
  "de": {
    "title": "Parallele Update zu \"{label}\"",
    "instructions": [
      "Updates wurden parallel zu ''{label}\" durchgeführt. Dies bedeutet, dass Änderungen möglicherweise im Konflikt miteinander stehen, da sie zu älteren Daten erstellt wurden, als sie schließlich von Central angewendet wurden.",
      "Überprüfen Sie die Updates, nehmen Sie die erforderlichen Bearbeitungen vor, und wenn Sie sicher sind, dass die Objektdaten korrekt sind, drücken Sie 'Als behoben markieren', um diese Warnmeldung zu löschen."
    ],
    "action": {
      "table": {
        "show": "Zusammenfassungstabelle anzeigen",
        "hide": "Zusammenfassungstabelle ausblenden"
      },
      "seeMoreDetails": "Mehr Details anzeigen",
      "editEntity": "Objekt bearbeiten",
      "markAsResolved": "Als gelöst markieren"
    },
    "successMessage": "Die Konfliktwarnung wurde von der Objekt entfernt.",
    "problem": {
      "400_32": "Ein anderer Benutzer hat den Konflikt bereits als gelöst markiert. Bitte aktualisieren Sie, um die aktualisierten Daten zu sehen.",
      "409_15": "Die Daten wurden von einem anderen Benutzer geändert. Bitte aktualisieren Sie die Seite, um die aktualisierten Daten anzuzeigen."
    }
  },
  "es": {
    "title": "Actualizaciones paralelas a “{label}”",
    "instructions": [
      "Se realizaron actualizaciones en “{label}” en paralelo. Esto significa que los cambios pueden entrar en conflicto entre sí, ya que se crearon con datos más antiguos de los que finalmente aplicó Central.",
      "Revise las actualizaciones, realice las modificaciones necesarias y, si está seguro de que los datos de esta entidad son correctos, presione \"Marcar como resuelto\" para borrar este mensaje de advertencia."
    ],
    "action": {
      "table": {
        "show": "Mostrar tabla de resumen",
        "hide": "Ocultar tabla de resumen"
      },
      "seeMoreDetails": "Ver más detalles",
      "editEntity": "Editar entidad",
      "markAsResolved": "Marcar como resuelto"
    },
    "successMessage": "El aviso de conflicto ha sido eliminado de la Entidad.",
    "problem": {
      "400_32": "Otro usuario ya ha marcado el conflicto como resuelto. Por favor, actualice para ver los datos actualizados.",
      "409_15": "Los datos han sido modificados por otro usuario. Actualice para ver los datos actualizados."
    }
  },
  "fr": {
    "title": "Mises à jour parallèles de \"{label}\"",
    "instructions": [
      "Des mises à jour de \"{label}\" ont été effectuées en parallèle. Cela signifie que les modifications peuvent être en conflit les unes avec les autres, car elles ont été créées sur des données plus anciennes que celles sur lesquelles Central pourrait les appliquer.",
      "Passez en revue les mises à jour, faites les modifications nécessaires, et si vous êtes certains que les données de cette Entité sont correctes, cliquez \"Marquer comme résolu\" pour supprimer le message d'avertissement."
    ],
    "action": {
      "table": {
        "show": "Voir la table de résumé",
        "hide": "Cacher la table de résumé"
      },
      "seeMoreDetails": "Voir plus de détails",
      "editEntity": "Éditer l'Entité",
      "markAsResolved": "Marquer comme résolu"
    },
    "successMessage": "L'avertissement de conflit a été supprimé de l'entité.",
    "problem": {
      "400_32": "Un autre utilisateur à déjà marqué ce conflit comme résolu. Merci de rafraîchir pour voir les données mises à jour.",
      "409_15": "Les données ont été modifiées par un autre utilisateur. Merci de rafraîchir pour voir les données mises à jour."
    }
  },
  "it": {
    "title": "Aggiornamenti paralleli a “{label}”",
    "instructions": [
      "Sono stati apportati aggiornamenti a “{label}” in parallelo. Ciò significa che le modifiche potrebbero essere in conflitto tra loro, poiché sono state create rispetto a dati più vecchi di quelli a cui sono stati applicati da Central.",
      "Rivedi gli aggiornamenti, apporta le modifiche necessarie e, se sei sicuro che i dati dell'entità siano corretti, premi \"Segna come risolto\" per cancellare questo messaggio di avviso."
    ],
    "action": {
      "table": {
        "show": "Mostra tabella di riepilogo",
        "hide": "Nascondi tabella di riepilogo"
      },
      "seeMoreDetails": "Vedi maggiori dettagli",
      "editEntity": "Modifica Entità",
      "markAsResolved": "Segna come risolto"
    },
    "successMessage": "L'avviso di conflitto è stato cancellato dall'Entità.",
    "problem": {
      "400_32": "Un altro utente ha già segnato il conflitto come risolto. Aggiorna la pagina per vedere i dati aggiornati.",
      "409_15": "I dati sono stati modificati da un altro utente. Aggiornare per vedere i dati aggiornati."
    }
  },
  "pt": {
    "title": "Atualizações paralelas para \"{label}\"",
    "instructions": [
      "Atualizações foram feitas para \"{label}\" em paralelo. Isso significa que as alterações podem estar em conflito entre si, pois foram criadas com base em dados mais antigos do que os que foram eventualmente aplicados pelo Central.",
      "Revise as atualizações, faça as alterações necessárias e, se tiver certeza de que os dados desta Entidade estão corretos, pressione \"Marcar como resolvido\" para limpar esta mensagem de aviso."
    ],
    "action": {
      "table": {
        "show": "Mostrar tabela de resumo",
        "hide": "Ocultar tabela de resumo"
      },
      "seeMoreDetails": "Ver mais detalhes",
      "editEntity": "Editar Entidade",
      "markAsResolved": "Marcar como resolvido"
    },
    "successMessage": "O aviso de conflito foi limpo da Entidade.",
    "problem": {
      "400_32": "Outro usuário já marcou o conflito como resolvido. Por favor, atualize a página para ver os dados atualizados.",
      "409_15": "Os dados foram modificados por outro usuário. Por favor, atualize a página para ver os dados atualizados."
    }
  },
  "sw": {
    "title": "Masasisho sambamba ya “{label}”",
    "instructions": [
      "Masasisho yalifanywa kwa “{label}” kwa sambamba. Hii inamaanisha kuwa mabadiliko yanaweza kuwa yanakinzana, kwa vile yaliandikwa dhidi ya data ya zamani kuliko yalivyotumiwa na Central.",
      "Kagua masasisho, fanya mabadiliko yoyote unayohitaji, na ikiwa una uhakika kwamba data hii ya Huluki ni sahihi bonyeza“Mark as resolved” ili kufuta ujumbe huu wa onyo."
    ],
    "action": {
      "seeMoreDetails": "Tazama maelezo zaidi",
      "editEntity": "Hariri Huluki",
      "markAsResolved": "Tia alama kuwa imesuluhishwa"
    },
    "successMessage": "Onyo la migogoro limeondolewa kwenye Shirika.",
    "problem": {
      "409_15": "Data imerekebishwa na mtumiaji mwingine. Tafadhali onyesha upya ili kuona data iliyosasishwa."
    }
  },
  "zh": {
    "title": "并行更新至“{label}”",
    "instructions": [
      "对“{label}”进行了并行更新。这意味着更改可能相互冲突，因为提交者是基于旧版数据进行的修改，而Central最终将其应用到了更新的数据版本上。",
      "请检查更新内容，根据需要编辑数据。若确认该实体数据正确，请点击“标记为已解决”以清除此警告信息。"
    ],
    "action": {
      "table": {
        "show": "显示汇总表格",
        "hide": "隐藏汇总表格"
      },
      "seeMoreDetails": "显示更多细节",
      "editEntity": "编辑实体",
      "markAsResolved": "标记为已解决"
    },
    "successMessage": "该实体的冲突警告已清除。",
    "problem": {
      "400_32": "其他用户已将此冲突标记为已解决，请刷新查看更新后的数据。",
      "409_15": "数据已被其他用户修改，请刷新以查看最新数据。"
    }
  },
  "zh-Hant": {
    "title": "並行更新「1{label}」",
    "instructions": [
      "並行更新了「1{label}」。這意味著更改可能會相互衝突，因為它們是根據較舊的資料編寫的，而不是 Central 最終應用的資料。",
      "查看更新，進行所需的任何編輯，如果您確定該實體資料正確，請按「標記為已解決」以清除此警告訊息。"
    ],
    "action": {
      "table": {
        "show": "顯示總計表",
        "hide": "隱藏統計表"
      },
      "seeMoreDetails": "顯示更多細節",
      "editEntity": "編輯實體",
      "markAsResolved": "標記為已解決"
    },
    "successMessage": "實體中的衝突警告已清除。",
    "problem": {
      "400_32": "另一位用戶已將衝突標記為已解決。請重新整理查看更新後的資料。",
      "409_15": "資料已被另一用戶修改。請重新整理查看更新後的資料。"
    }
  }
}
</i18n>
