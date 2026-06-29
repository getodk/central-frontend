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
  <div id="entity-conflict-summary" class="panel panel-danger">
    <div class="panel-heading">
      <span class="icon-exclamation-circle"></span>
      <div>
        <h1 class="panel-title">{{ $t('title') }}</h1>
        <p>
          {{ $t('subtitle[0]') }}
          <br>
          {{ $t('subtitle[1]') }}
        </p>
      </div>
    </div>
    <div class="panel-body">
      <entity-conflict-table :uuid="entity.uuid"
        :versions="relevantToConflict"/>
      <div v-if="project.permits('entity.update')" class="panel-footer">
        <span class="icon-arrow-circle-right"></span>
        <p>
          {{ $t('footer[0]') }}
          <br>
          {{ $t('footer[1]') }}
        </p>
        <button type="button" class="btn btn-default" @click="showConfirmation">
          <span class="icon-random"></span>{{ $t('markAsResolved') }}
        </button>
      </div>
    </div>
  </div>
  <confirmation v-bind="confirm" @hide="hideConfirm" @success="markAsResolved">
    <template #body>
      <p>
        {{ $t('confirmation.body') }}
      </p>
    </template>
  </confirmation>
</template>

<script setup>
import { ref, inject, computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Confirmation from '../confirmation.vue';
import EntityConflictTable from './conflict-table.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

const { request, awaitingResponse } = useRequest();
const { t } = useI18n();
// The component assumes that this data will exist when the component is
// created.
const { project, entity, entityVersions } = useRequestData();
const { alert } = inject('container');

defineOptions({
  name: 'EntityConflictSummary'
});
const emit = defineEmits(['resolve']);

const relevantToConflict = computed(() =>
  entityVersions.filter(version => version.relevantToConflict));

const confirmModalState = ref(false);
const confirm = computed(() => ({
  state: confirmModalState.value,
  title: t('confirmation.title'),
  yesText: t('confirmation.confirm'),
  noText: t('action.noCancel'),
  awaitingResponse: awaitingResponse.value
}));
const showConfirmation = () => {
  confirmModalState.value = true;
};
const hideConfirm = () => {
  confirmModalState.value = false;
};

const datasetName = inject('datasetName');
const markAsResolved = () => {
  const url = apiPaths.entity(project.id, datasetName, entity.uuid, {
    resolve: true,
    baseVersion: entity.currentVersion.version
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
    .then(({ data }) => {
      hideConfirm();
      alert.success(t('conflictResolved'));

      entity.conflict = data.conflict;
      entity.updatedAt = data.updatedAt;

      emit('resolve');
    })
    .catch(noop);
};
</script>

<style lang="scss" scoped>
  .panel { margin-bottom: 35px; }

  .panel-heading {
    display: flex;
    padding: 15px;

    span {
      width: 30px;
      font-size: 20px;
    }

    div {
      flex: auto;
      h1 {
        margin-bottom: 2px;
        font-size: 19px;
      }
      p {
        margin-bottom: 0;
        line-height: 16px;
      }
    }

  }

  .panel-body { padding-top: 0; }

  #entity-conflict-table {
    margin-left: -15px;
    margin-right: -15px;
    &:last-child { margin-bottom: -15px; }

    // Align the leftmost text of the first column with the icon in the
    // .panel-heading.
    :deep(th:first-child) { padding-left: 15px; }

    :deep(.empty-table-message) {
      margin-bottom: 15px;
      margin-left: 15px;
      margin-top: 15px;
    }
  }

  .panel-footer {
    display: flex;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;

    > span {
      width: 30px;
      font-size: 20px;
      align-self: center;
      color: #9F9F9F
    }

    p {
      flex: auto;
      margin: 0;
      max-width: unset;
      line-height: 16px;
    }

    button {
      height: 34px;
      align-self: center;
      overflow: visible;
    }
  }
</style>

<i18n lang="json5">
  {
    "en": {
      "title": "Data updates in parallel",
      "subtitle": [
        "One or more updates have been made based on data that may have been out of date.",
        "Please review this summary of the parallel updates."
      ],
      "footer": [
        "If any values need to be adjusted, you can edit the Entity data directly.",
        "If everything looks okay, click “Mark as resolved” to dismiss this warning."
      ],
      // @transifexKey component.EntityResolve.action.markAsResolved
      "markAsResolved": "Mark as resolved",
      "confirmation":{
        "title": "Is this Entity okay?",
        "body": "After you have reviewed the possibly conflicting updates and made any updates you need to, you can click on Confirm below to clear the parallel update warning.",
        "confirm": "Confirm"
      },
      "problem": {
        // @transifexKey component.EntityResolve.problem.400_32
        "400_32": "Another user has already marked the conflict as resolved. Please refresh to see the updated data.",
        // @transifexKey component.EntityUpdate.problem.409_15
        "409_15": "Data has been modified by another user. Please refresh to see the updated data."
      },
      "conflictResolved": "The conflict warning has been cleared."
    }
  }
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Aktualizace dat paralelně",
    "subtitle": [
      "Jedna nebo více aktualizací bylo provedeno na základě dat, která mohla být zastaralá.",
      "Prosím, zkontrolujte tuto souhrn paralelních aktualizací."
    ],
    "footer": [
      "Pokud je třeba upravit nějaké hodnoty, můžete přímo upravit data Entity.",
      "Pokud vše vypadá v pořádku, klikněte na \"Označit jako vyřešeno\" k zavření tohoto varování."
    ],
    "confirmation": {
      "body": "Poté, co jste zkontrolovali možně konfliktní aktualizace a provedli všechny potřebné aktualizace, můžete kliknout na Potvrdit níže, abyste odstranili varování o paralelní aktualizaci.",
      "confirm": "Potvrdit"
    },
    "markAsResolved": "Označit jako vyřešeno",
    "problem": {
      "400_32": "Jiný uživatel již označil konflikt jako vyřešený. Aktualizujte prosím, abyste viděli aktualizovaná data.",
      "409_15": "Data byla upravena jiným uživatelem. Aktualizujte prosím stránku, abyste viděli aktualizovaná data."
    }
  },
  "de": {
    "title": "Daten werden paralell aktualisiert.",
    "subtitle": [
      "Ein oder mehrere Updates basieren auf Daten, die möglicherweise veraltert sind.",
      "Bitte prüfe die Zusammenfassung der paralellen Updates."
    ],
    "footer": [
      "Wenn Werte angepasst werden müssen, können Sie die Objektdaten direkt bearbeiten.",
      "Wenn alles in Ordnung aussieht, klicken Sie auf „Als 'In Ordnung' markieren“, um diese Warnung zu schließen."
    ],
    "confirmation": {
      "title": "Ist dieses Objekt OK?",
      "body": "Nachdem Sie die möglicherweise widersprüchlichen Aktualisierungen überprüft und alle erforderlichen Aktualisierungen vorgenommen haben, können Sie unten auf „Bestätigen“ klicken, um die Warnung zu parallelen Aktualisierungen zu löschen.",
      "confirm": "Bestätigen"
    },
    "conflictResolved": "Der Konfliktwarnhinweis wurde aufgehoben.",
    "markAsResolved": "Als gelöst markieren",
    "problem": {
      "400_32": "Ein anderer Benutzer hat den Konflikt bereits als gelöst markiert. Bitte aktualisieren Sie, um die aktualisierten Daten zu sehen.",
      "409_15": "Die Daten wurden von einem anderen Benutzer geändert. Bitte aktualisieren Sie die Seite, um die aktualisierten Daten anzuzeigen."
    }
  },
  "es": {
    "title": "Actualizaciones de datos en paralelo",
    "subtitle": [
      "Una o más actualizaciones se han realizado en base a datos que pueden haber estado desactualizados.",
      "Por favor revise este resumen de las actualizaciones paralelas."
    ],
    "footer": [
      "Si es necesario ajustar algún valor, puedes editar directamente los datos de la entidad.",
      "Si todo parece estar bien, haz clic en \"Marcar como resuelto\" para descartar esta advertencia."
    ],
    "confirmation": {
      "title": "¿Esta entidad está bien?",
      "body": "Después de haber revisado las actualizaciones posiblemente conflictivas y haber realizado las actualizaciones necesarias, puedes hacer clic en Confirmar a continuación para eliminar la advertencia de actualización paralela.",
      "confirm": "Confirmar"
    },
    "conflictResolved": "La advertencia de conflicto ha sido eliminada.",
    "markAsResolved": "Marcar como resuelto",
    "problem": {
      "400_32": "Otro usuario ya ha marcado el conflicto como resuelto. Por favor, actualice para ver los datos actualizados.",
      "409_15": "Los datos han sido modificados por otro usuario. Actualice para ver los datos actualizados."
    }
  },
  "fr": {
    "title": "Mises à jour de données en parallèle",
    "subtitle": [
      "Une ou plusieurs mises à jour ont été faites sur la base de données qui pouvaient être obsolètes",
      "Merci de vérifier ce résumé des mises à jours parallèles."
    ],
    "footer": [
      "Si une valeur doit être ajustée, vous pouvez éditer l'Entité directement.",
      "Si tout semble correct, cliquez \"Marquer comme résolu\" pour ne plus afficher cet avertissement."
    ],
    "confirmation": {
      "title": "Cette Entité est-elle correcte ?",
      "body": "Après avoir examiné les possibles conflits de mise à jour et fait les mises à jour nécessaires, vous pouvez cliquer sur Confirmer ci-dessous pour effacer l'avertissement.",
      "confirm": "Confirmer"
    },
    "conflictResolved": "L'avertissement de conflit a été effacé.",
    "markAsResolved": "Marquer comme résolu",
    "problem": {
      "400_32": "Un autre utilisateur à déjà marqué ce conflit comme résolu. Merci de rafraîchir pour voir les données mises à jour.",
      "409_15": "Les données ont été modifiées par un autre utilisateur. Merci de rafraîchir pour voir les données mises à jour."
    }
  },
  "it": {
    "title": "Aggiornamenti Dati in parallelo",
    "subtitle": [
      "Uno o più aggiornamenti sono stati effettuati in base a dati che potrebbero essere stati obsoleti.",
      "Per favore, rivedi questo riassunto degli aggiornamenti paralleli."
    ],
    "footer": [
      "Se è necessario modificare alcuni valori, è possibile modificare direttamente i dati dell'Entità.",
      "Se tutto sembra corretto, clicca su \"Segna come risolto\" per ignorare questo avviso."
    ],
    "confirmation": {
      "title": "È questa Entità okay?",
      "body": "Dopo aver esaminato gli aggiornamenti potenzialmente in conflitto e aver effettuato gli aggiornamenti necessari, puoi fare clic su Conferma in basso per eliminare l'avviso di aggiornamento parallelo.",
      "confirm": "Conferma"
    },
    "conflictResolved": "L'avviso di conflitto è stato eliminato.",
    "markAsResolved": "Segna come risolto",
    "problem": {
      "400_32": "Un altro utente ha già segnato il conflitto come risolto. Aggiorna la pagina per vedere i dati aggiornati.",
      "409_15": "I dati sono stati modificati da un altro utente. Aggiornare per vedere i dati aggiornati."
    }
  },
  "pt": {
    "title": "Atualizações de dados em paralelo",
    "subtitle": [
      "Uma ou mais atualizações foram feitas com base em dados que podem estar desatualizados.",
      "Por favor, revise este resumo das atualizações paralelas."
    ],
    "footer": [
      "Se algum valor precisar ser ajustado, você pode alterar os dados da Entidade diretamente.",
      "Se tudo parecer correto, clique em “Marcar como resolvido” para descartar esse aviso."
    ],
    "confirmation": {
      "title": "Esta Entidade está correta?",
      "body": "Após revisar as atualizações possivelmente conflitantes e fazer as atualizações necessárias, você pode clicar em Confirmar abaixo para limpar o aviso de atualização paralela.",
      "confirm": "Confirmar"
    },
    "conflictResolved": "O aviso de conflito foi resolvido.",
    "markAsResolved": "Marcar como resolvido",
    "problem": {
      "400_32": "Outro usuário já marcou o conflito como resolvido. Por favor, atualize a página para ver os dados atualizados.",
      "409_15": "Os dados foram modificados por outro usuário. Por favor, atualize a página para ver os dados atualizados."
    }
  },
  "sw": {
    "title": "Masasisho ya data inafanyika sambamba",
    "subtitle": [
      "Sasisho moja au zaidi yamefanywa kulingana na data ambayo huenda ilikuwa imepitwa na wakati.",
      "Tafadhali kagua muhtasari huu wa masasisho sambamba."
    ],
    "footer": [
      "Ikiwa thamani zozote zinahitaji kurekebishwa, unaweza kuhariri data ya Huluki moja kwa moja.",
      "Ikiwa kila kitu kiko sawa, bofya \"Weka alama kuwa imetatuliwa\" ili kuondoa onyo hili."
    ],
    "confirmation": {
      "title": "Je! huluki hiki ni sawa?",
      "body": "Baada ya kukagua masasisho yanayoweza kukinzana na kufanya masasisho yoyote unayohitaji, unaweza kubofya Thibitisha hapa chini ili kufuta onyo sambamba la sasisho.",
      "confirm": "Thibitisha"
    },
    "markAsResolved": "Tia alama kuwa imesuluhishwa",
    "problem": {
      "409_15": "Data imerekebishwa na mtumiaji mwingine. Tafadhali onyesha upya ili kuona data iliyosasishwa."
    }
  },
  "zh": {
    "title": "数据同步更新",
    "subtitle": [
      "已根据可能过期的数据进行了一个或多个更新。",
      "请查看并核对以下同步更新的摘要。"
    ],
    "footer": [
      "如果需要调整任何数值，您可以直接编辑实体数据。",
      "如果一切正常，请点击“标记为已解决”以忽略此警告。"
    ],
    "confirmation": {
      "title": "此实体是否正常？",
      "body": "在您查看并处理可能存在冲突的更新后，可点击下方的“确认”以清除同步更新警告。",
      "confirm": "确认"
    },
    "conflictResolved": "此冲突警告已清除。",
    "markAsResolved": "标记为已解决",
    "problem": {
      "400_32": "其他用户已将此冲突标记为已解决，请刷新查看更新后的数据。",
      "409_15": "数据已被其他用户修改，请刷新以查看最新数据。"
    }
  },
  "zh-Hant": {
    "title": "資料並行更新",
    "subtitle": [
      "根據可能已過時的資料進行了一或多項更新。",
      "請查看並行更新的摘要。"
    ],
    "footer": [
      "如果需要調整任何數值，您可以直接編輯實體資料。",
      "如果一切正常，請按一下「標記為已解決」以忽略此警告。"
    ],
    "confirmation": {
      "title": "這個實體還好嗎？",
      "body": "在檢查了可能衝突的更新並進行了所需的任何更新後，您可以點擊下面的「確認」以清除並行更新警告。",
      "confirm": "確認"
    },
    "conflictResolved": "衝突警告已清除。",
    "markAsResolved": "標記為已解決",
    "problem": {
      "400_32": "另一位用戶已將衝突標記為已解決。請重新整理查看更新後的資料。",
      "409_15": "資料已被另一用戶修改。請重新整理查看更新後的資料。"
    }
  }
}
</i18n>
