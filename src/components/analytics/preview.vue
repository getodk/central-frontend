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
  <modal id="analytics-preview" :state="state" hideable backdrop size="large"
    @hide="$emit('hide')">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <div class="modal-introduction">
        <p>{{ $t('introduction[0]') }}</p>
        <p>{{ $t('introduction[1]') }}</p>
        <p>{{ $t('introduction[2]') }}</p>
      </div>
      <loading :state="analyticsPreview.initiallyLoading"/>
      <template v-if="analyticsPreview.dataExists">
        <analytics-metrics-table :title="$t('common.system')" :metrics="systemSummary"/>
        <template v-if="numProjects > 0">
          <div id="analytics-preview-project-summary">
            <span class="header">{{ $t('projects.title') }}</span>
            <span class="explanation">{{ $tcn('projects.subtitle', numProjects) }}</span>
          </div>
          <div id="analytics-preview-project-tables">
            <div id="users-forms-column">
              <analytics-metrics-table :title="$t('resource.users')" :metrics="userSummary"/>
              <analytics-metrics-table :title="$t('resource.forms')" :metrics="formSummary"/>
            </div>
            <div id="submissions-column">
              <analytics-metrics-table :title="$t('resource.submissions')"
                :metrics="submissionSummary"/>
              <analytics-metrics-table :title="$t('submissionStates')"
                :metrics="submissionStateSummary"/>
              <analytics-metrics-table :title="$t('other')"
                :metrics="otherSummary"/>
            </div>
          </div>
        </template>
        <template v-if="numDatasets > 0">
          <div id="analytics-preview-dataset-summary">
            <span class="header">{{ $t('entities.title') }}</span>
            <span class="explanation">{{ $tcn('entities.subtitle', numDatasets) }}</span>
          </div>
          <analytics-metrics-table :title="$t('resource.entities')"
            :metrics="firstDataset"/>
        </template>
      </template>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary" @click="$emit('hide')">
          {{ $t('action.close') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script>
import { omit, pick, flatten } from 'ramda';

import Loading from '../loading.vue';
import Modal from '../modal.vue';
import AnalyticsMetricsTable from './metrics-table.vue';

import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

// Metrics to filter out (with pick/omit) and put in
// a separate table
const submissionStateMetrics = [
  'num_submissions_received',
  'num_submissions_approved',
  'num_submissions_has_issues',
  'num_submissions_rejected',
  'num_submissions_edited'
];

export default {
  name: 'AnalyticsPreview',
  components: { AnalyticsMetricsTable, Loading, Modal },
  props: {
    state: Boolean
  },
  emits: ['hide'],
  setup() {
    const { createResource } = useRequestData();
    const analyticsPreview = createResource('analyticsPreview');
    return { analyticsPreview };
  },
  computed: {
    systemSummary() {
      return this.analyticsPreview.system;
    },
    firstProject() {
      return this.analyticsPreview.projects.reduce((a, b) => ((a.submissions.num_submissions_received.recent > b.submissions.num_submissions_received.recent) ? a : b));
    },
    firstDataset() {
      const { id, ...ds } = flatten(this.analyticsPreview.projects.map(p => p.datasets)).reduce((a, b) => ((a.num_entities.recent > b.num_entities.recent) ? a : b), { num_entities: {} });
      return ds;
    },
    numDatasets() {
      return flatten(this.analyticsPreview.projects.map(p => p.datasets)).length;
    },
    userSummary() {
      return this.firstProject.users;
    },
    formSummary() {
      return this.firstProject.forms;
    },
    submissionSummary() {
      // The submission metrics come from the API together but will be split.
      // This summary is for submission metrics NOT about state.
      return omit(submissionStateMetrics, this.firstProject.submissions);
    },
    submissionStateSummary() {
      // The submission metrics come from the API together but will be split.
      // This summary is for submission state metrics (approved, rejected, etc.)
      return pick(submissionStateMetrics, this.firstProject.submissions);
    },
    numProjects() {
      return this.analyticsPreview.projects.length;
    },
    otherSummary() {
      return this.firstProject.other;
    }
  },
  watch: {
    state(state) {
      if (state)
        this.fetchData();
      else
        this.analyticsPreview.reset();
    }
  },
  methods: {
    fetchData() {
      this.analyticsPreview.request({ url: '/v1/analytics/preview' })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#analytics-preview {
  .modal-introduction > p {
    max-width: 100%;
  }
}

#analytics-preview-project-summary, #analytics-preview-dataset-summary {
  padding-bottom: 5px;

  .header {
    font-weight: 500;
    padding-right: 10px;
  }
}

#analytics-preview-project-tables {
  display: flex;
  flex-wrap: wrap;

  #users-forms-column, #submissions-column {
    margin-right: 5px;
    margin-left: 5px;
    flex-grow: 1;
  }

  margin-left: -5px;
  margin-right: -5px;
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Anonymized Usage Report",
    "introduction": [
      "Thank you for thinking about sending some usage information. This data will help us prioritize your needs!",
      "Shown here is the report we are collecting currently. To respond to new features and needs, we will sometimes change what is reported, but we will only ever gather summary averages like you see here.",
      "You can always come here to see what is being collected."
    ],
    "projects": {
      // This is the title shown above a series of metrics about Project usage.
      "title": "Project Summaries",
      "subtitle": "(Showing the most active Project of {count} Project) | (Showing the most active Project of {count} Projects)"
    },
    // This is the title of a single table in the analytics metrics report
    // of metrics about submission state (approved, rejected, etc)
    "submissionStates": "Submission States",
    "entities": {
      // This is the title shown above a series of metrics about Entities usage.
      "title": "Entities Summaries",
      "subtitle": "(Showing the most active Entity List of {count} Entity List) | (Showing the most active Entity List of {count} Entity Lists)"
    },
    // This is the title of a single table in the analytics metrics report
    // of other additional metrics that don't fit into other categories
    "other": "Other"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "title": "Anonymizovaná zpráva o použití",
    "introduction": [
      "Děkujeme, že uvažujete o zaslání informací o používání. Tyto údaje nám pomohou stanovit priority vašich potřeb!",
      "Zde je zobrazena zpráva, kterou v současné době shromažďujeme. Abychom mohli reagovat na nové funkce a potřeby, budeme občas měnit to, co se hlásí, ale vždy budeme shromažďovat pouze souhrnné průměry, které vidíte zde.",
      "Vždy se sem můžete přijít podívat, co se sbírá."
    ],
    "projects": {
      "title": "Shrnutí projektu",
      "subtitle": "(Zobrazuje {count} nejaktivnější projekt projektu) | (Zobrazuje {count} nejaktivnější projekty projektu) | (Zobrazuje {count} nejaktivnějších projektů projektu) | (Zobrazuje {count} nejaktivnějších projektů projektu)"
    },
    "submissionStates": "Stavy odeslání",
    "entities": {
      "title": "Souhrny subjektů"
    },
    "other": "Jiné"
  },
  "de": {
    "title": "Anonymisierter Nutzungsbericht",
    "introduction": [
      "Dank, dass du darüber nachdenkst uns Nutzungsinformationen zu senden. Diese Daten helfen uns, eure Bedürfnisse zu priorisieren!",
      "Hier ersichtlich ist der Bericht zur aktuellen Datensammlung. Um auf neue Funktionen und Anforderungen zu reagieren, ändern wir manchmal die Berichte, aber wir sammeln immer nur Durchschnittswerte, wie hier gezeigt.",
      "Du kannst jederzeit hierher kommen, um zu sehen, welche Daten gesammelt werden."
    ],
    "projects": {
      "title": "Projekt-Übersicht",
      "subtitle": "(Zeigt das aktivste Projekt der {count} Projekt) | (Zeigt das aktivste Projekt der {count} Projekte)"
    },
    "submissionStates": "Einsendungenstatus",
    "entities": {
      "title": "Objektzusammenfassungen",
      "subtitle": "(Zeigt die aktivste Objektliste von {count} Objektliste) | (Zeigt die aktivste Objektliste von {count} Objektlisten)"
    },
    "other": "Anderes"
  },
  "es": {
    "title": "Informe de uso anonimizado",
    "introduction": [
      "Gracias por pensar en enviar información de uso. Estos datos nos ayudarán a priorizar sus necesidades.",
      "Aquí se muestra el informe que estamos recopilando actualmente. Para responder a las nuevas funciones y necesidades, a veces cambiaremos lo que se informa, pero solo recopilaremos promedios resumidos como se ve aquí.",
      "Siempre puedes venir aquí para ver qué se está recolectando."
    ],
    "projects": {
      "title": "Resúmenes de proyectos",
      "subtitle": "(Mostrando el Proyecto más activo de {count} Proyecto) | (Mostrando el Proyecto más activo de {count} Proyectos) | (Mostrando el Proyecto más activo de {count} Proyectos)"
    },
    "submissionStates": "Estados de envío",
    "entities": {
      "title": "Resúmenes de entidades",
      "subtitle": "(Mostrando la lista de entidades más activa de {count} lista de entidades) | (Mostrando las listas de entidades más activas de {count} listas de entidades) | (Mostrando las listas de entidades más activas de {count} listas de entidades)"
    },
    "other": "Otro"
  },
  "fr": {
    "title": "Rapport d'utilisation anonymisé",
    "introduction": [
      "Merci de penser à nous envoyer quelques informations d’utilisation. Ces données nous aideront à prioriser vos besoins !",
      "Voici le rapport que nous recueillons actuellement. Pour répondre aux nouvelles fonctionnalités et aux nouveaux besoins, nous changerons parfois ce qui est rapporté, mais nous ne recueillerons jamais que des informations synthétiques, comme celles que vous voyez ici.",
      "Vous pouvez toujours venir ici voir ce qui est collecté."
    ],
    "projects": {
      "title": "Résumés du projet",
      "subtitle": "(Affichage du projet le plus actif parmi {count} projets) | (Affichage du projet le plus actif parmi {count} projets) | (Affichage du projet le plus actif parmi {count} projets)"
    },
    "submissionStates": "États des soumissions",
    "entities": {
      "title": "Résumés des entités",
      "subtitle": "(Montre la liste d'entités la plus active de {count} liste d'entités) | (Montre la liste d'entités la plus active de {count} listes d'entités) | (Montre la liste d'entités la plus active de {count} listes d'entités)"
    },
    "other": "Autre"
  },
  "it": {
    "title": "Report di utilizzo anonimo",
    "introduction": [
      "Grazie per aver pensato di inviare alcune informazioni sull'utilizzo. Questi dati ci aiuteranno a dare la priorità alle tue esigenze!",
      "Qui è mostrato il rapporto che stiamo raccogliendo attualmente. Per rispondere a nuove funzionalità ed esigenze, a volte modificheremo ciò che viene segnalato, ma raccoglieremo solo medie riepilogative come vedi qui.",
      "Puoi sempre venire qui per vedere cosa viene raccolto."
    ],
    "projects": {
      "title": "Riepiloghi del progetto",
      "subtitle": "(Visualizzazione del progetto più attivo di {count} Progetto) | (Visualizzazione del progetto più attivo di {count} Progetti) | (Visualizzazione del progetto più attivo di {count} Progetti)"
    },
    "submissionStates": "Stato invio",
    "entities": {
      "title": "Riassunti delle entità",
      "subtitle": "(Visualizzazione della Lista Entità più attiva di {count} Lista Entità) | (Visualizzazione delle Liste Entità più attive di {count} Liste Entità) | (Visualizzazione della Lista Entità più attiva di {count} Liste Entità)"
    },
    "other": "Altro"
  },
  "ja": {
    "title": "匿名化された利用状況報告",
    "introduction": [
      "利用データの送信を検討して頂き、ありがとうございます。データによりあなたのニーズは満たされやすくなります。",
      "ここで表示されている情報を私たちは収集しています。新たな機能や要望に応えるため、収集する情報を時折変更しますが、ここで表示されるような集計データのみを収集します。",
      "あなたはいつでもここで何が収集されているのかを確認できます。"
    ],
    "projects": {
      "title": "プロジェクトの概要",
      "subtitle": "（最もアクティブな{count}つのプロジェクトについて）"
    },
    "submissionStates": "提出済フォームの状態"
  },
  "pt": {
    "title": "Relatório de uso com dados anônimos",
    "introduction": [
      "Obrigado por considerar o envio de algumas informações de utilização. Esses dados nos ajudarão a priorizar suas necessidades!",
      "O relatório do que está sendo coletado atualmente está exibido aqui. Para atender a novas funcionalidades e necessidades, nós poderemos às vezes mudar o que é reportado, mas nós sempre usaremos apenas médias de resumo de uso como as que você vê aqui.",
      "Você sempre pode vir aqui para ver o que está sendo coletado."
    ],
    "projects": {
      "title": "Resumo do projeto",
      "subtitle": "(Mostrando o projeto mais ativo de {count} projeto) | (Mostrando o projeto mais ativo de {count} projetos) | (Mostrando o projeto mais ativo de {count} projetos)"
    },
    "submissionStates": "Status de envio",
    "entities": {
      "title": "Resumos de Entidades",
      "subtitle": "(Mostrando a Lista de Entidades mais ativa de {count} Lista de Entidades) | (Mostrando a Lista de Entidades mais ativa de {count} Listas de Entidades) | (Mostrando a Lista de Entidades mais ativa de {count} Listas de Entidades)"
    },
    "other": "Outro"
  },
  "sw": {
    "title": "Ripoti ya Matumizi Isiyojulikana",
    "introduction": [
      "Asante kwa kufikiria kutuma habari ya matumizi. Data hii itatusaidia kutanguliza mahitaji yako!",
      "Inayoonyeshwa hapa ni ripoti tunayokusanya kwa sasa. Ili kukabiliana na vipengele na mahitaji mapya, wakati mwingine tutabadilisha kile kinachoripotiwa, lakini tutawahi tu kukusanya wastani wa muhtasari kama unavyoona hapa.",
      "Unaweza kuja hapa kila wakati ili kuona kile kinachokusanywa."
    ],
    "projects": {
      "title": "Muhtasari wa Mradi",
      "subtitle": "(Inaonyesha Mradi amilifu zaidi wa Mradi ya {count}) | (Inaonyesha Mradi amilifu zaidi wa Miradi ya {count})"
    },
    "submissionStates": "Nchi za Uwasilishaji",
    "entities": {
      "title": "Muhtasari wa Vyombo",
      "subtitle": "(Inaonyesha Orodha ya Huluki inayotumika zaidi {count} ya Orodha ya Huluki) | (Inaonyesha Orodha ya Huluki inayotumika zaidi {count} ya Orodha za Huluki)"
    },
    "other": "Nyingine"
  },
  "zh": {
    "title": "匿名使用报告",
    "introduction": [
      "感谢您考虑发送使用信息，这些数据将帮助我们更好地优先处理您的需求！",
      "此处显示的是我们当前收集的报告。为了响应新的功能和需求，我们可能会不时调整报告内容，但我们只会收集如当前所示的汇总平均数据。",
      "您可以随时来这里检查收集的内容"
    ],
    "projects": {
      "title": "项目概要",
      "subtitle": "正在展示{count}个项目中最活跃的项目"
    },
    "submissionStates": "提交状态",
    "entities": {
      "title": "实体摘要",
      "subtitle": "（显示{count}个实体列表中最活跃的实体列表）"
    },
    "other": "其他"
  },
  "zh-Hant": {
    "title": "匿名使用報告",
    "introduction": [
      "感謝您考慮發送一些使用資訊。這些數據將幫助我們優先考慮您的需求！",
      "這裡顯示的是我們目前正在收集的報告。為了回應新功能和需求，我們有時會更改報告的內容，但我們只會收集匯總平均值，就像您在此處看到的那樣。",
      "您可以隨時來這裡看看正在收集什麼。"
    ],
    "projects": {
      "title": "專案概要",
      "subtitle": "(顯示 {count} 個專案中最活躍的專案)"
    },
    "submissionStates": "提交狀態",
    "entities": {
      "title": "實體摘要",
      "subtitle": "(顯示 {count} 個實體清單中最活躍的實體清單)"
    },
    "other": "其他"
  }
}
</i18n>
