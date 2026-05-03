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
  <modal id="dataset-new" :state="state" :hideable="!awaitingResponse" backdrop
    @hide="hideOrComplete" @shown="nameGroup.focus()">
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <template v-if="step === 0">
        <div class="modal-introduction">
          <p>{{ $t('introduction[0]') }}</p>
          <i18n-t tag="p" keypath="moreInfo.helpArticle.full">
            <template #helpArticle>
              <doc-link to="central-entities/">{{ $t('moreInfo.helpArticle.helpArticle') }}</doc-link>
            </template>
          </i18n-t>
          <p v-if="project.keyId">
            <span class="icon-exclamation-triangle"></span>{{ $t('encrypted') }}
          </p>
        </div>
        <form @submit.prevent="submit">
          <form-group ref="nameGroup" v-model.trim="name"
            :placeholder="$t('entityListName')" required autocomplete="off"/>
          <div class="modal-actions">
            <button type="button" class="btn btn-link"
              :aria-disabled="awaitingResponse" @click="hideOrComplete">
              {{ $t('action.cancel') }}
            </button>
            <button type="submit" class="btn btn-primary"
              :aria-disabled="awaitingResponse">
              {{ $t('action.create') }} <spinner :state="awaitingResponse"/>
            </button>
          </div>
        </form>
      </template>
      <template v-else>
        <div class="modal-introduction">
          <div id="dataset-new-success">
            <span class="icon-check-circle"></span>
            <p>
              <strong>{{ $t('common.success') }}</strong>
              <sentence-separator/>
              <span>{{ $t('success[0]', createdDataset) }}</span>
            </p>
          </div>
          <div>{{ $t('success[1]') }}</div>
        </div>
        <div class="modal-actions">
          <button id="dataset-new-done-button" type="button" class="btn btn-primary" @click="complete">
            {{ $t('action.done') }}
          </button>
        </div>
      </template>
    </template>
  </modal>
</template>

<script setup>
import { inject, ref, watch } from 'vue';
import { equals } from 'ramda';
import { useI18n } from 'vue-i18n';

import Modal from '../modal.vue';
import DocLink from '../doc-link.vue';
import FormGroup from '../form-group.vue';
import SentenceSeparator from '../sentence-separator.vue';
import Spinner from '../spinner.vue';
import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { useRequestData } from '../../request-data';
import { noop } from '../../util/util';

const { request, awaitingResponse } = useRequest();
const { project } = useRequestData();

defineOptions({
  name: 'DatasetNew'
});
const props = defineProps({
  state: {
    type: Boolean,
    default: false
  }
});
const nameGroup = ref(null);
const name = ref('');
const step = ref(0);
const createdDataset = ref(null);

const emit = defineEmits(['hide', 'success']);
const redAlert = inject('redAlert');

watch(() => props.state, (state) => {
  if (!state) name.value = '';
});

const { t } = useI18n();
const submit = () => {
  request({
    method: 'POST',
    url: apiPaths.datasets(project.id),
    data: { name: name.value },
    problemToAlert: ({ code, details }) =>
      (code === 409.3 && equals(details.fields, ['name', 'projectId'])
        ? t('problem.409_3', { datasetName: details.values[0] })
        : null)
  })
    .then(({ data }) => {
      // Hide the error message if there is one
      redAlert.hide();
      // Reset the form
      name.value = '';
      // Show the next panel of the modal
      step.value = 1;
      createdDataset.value = data;
    })
    .catch(noop);
};

const complete = () => {
  emit('success', createdDataset.value);
};

const hideOrComplete = () => {
  if (createdDataset.value == null)
    emit('hide');
  else
    complete();
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';
@import '../../assets/scss/mixins';

.icon-exclamation-triangle {
  color: $color-warning;
  margin-right: $margin-right-icon;
}

#dataset-new-success {
  display: flex;
  align-items: center;
  margin-bottom: 7px;

  > p {
    width: 80%;
    margin-bottom: 0px;
  }

  .icon-check-circle {
    color: $color-success;
    font-size: 32px;
    margin-right: 10px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This is the title at the top of a pop-up.
    "title": "Create Entity List",
    "introduction": [
      // @transifexKey component.DatasetList.heading.0
      "Entities let you share information between Forms so you can collect longitudinal data, manage cases over time, and represent other workflows with multiple steps."
    ],
    // This is shown in the introduction as a usage note/warning when the project is encrypted.
    "encrypted": "This Project is encrypted. Forms and Submissions will not be able to modify any Entities in this List. Entities must be managed through Central or the API.",
    // This appears above a text input field for the name of an Entity List
    "entityListName": "Entity List name",
    "success": [
      "The Entity List “{name}” has been created.",
      "You can get started with it by adding its data properties directly on this page, or by uploading Forms that use it. In this case, any properties the Form calls out will be automatically created when you publish the Form."
    ],
    "problem": {
      "409_3": "An Entity List already exists in this Project with the name of “{datasetName}”."
    },
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "introduction": [
      "Entity umožňují sdílet informace mezi formuláři, takže můžete shromažďovat longitudinální data, spravovat případy v čase a reprezentovat další pracovní postupy s více kroky."
    ]
  },
  "de": {
    "title": "Objektliste erstellen",
    "encrypted": "Dieses Projekt ist verschlüsselt. Formulare und Übermittlungen sind nicht in der Lage, Objekte in dieser Liste zu ändern. Objekte müssen über Central oder die API verwaltet werden.",
    "entityListName": "Name der Objektliste",
    "success": [
      "Die Objektliste \"{name}\" ist erstellt worden.",
      "Sie können damit beginnen, indem Sie die Dateneigenschaften direkt auf dieser Seite hinzufügen oder indem Sie Formulare hochladen, die sie verwenden. In diesem Fall werden alle Eigenschaften, die das Formular aufruft, automatisch erstellt, wenn Sie das Formular veröffentlichen."
    ],
    "problem": {
      "409_3": "In diesem Projekt existiert bereits eine Objektliste mit dem Namen “{datasetName}”."
    },
    "introduction": [
      "Objekte ermöglichen es Ihnen, Informationen zwischen Formularen zu teilen, sodass Sie longitudinale Daten sammeln, Fälle im Laufe der Zeit verwalten und andere Arbeitsabläufe mit mehreren Schritten darstellen können."
    ]
  },
  "es": {
    "title": "Crear lista de entidades",
    "encrypted": "Este Proyecto está encriptado. Los Formularios y Envíos no podrán modificar ninguna Entidad de esta Lista. Las Entidades deben gestionarse a través de Central o de la API.",
    "entityListName": "Nombre de la lista de entidades",
    "success": [
      "La lista de entidades “{name}” se ha creado.",
      "Puedes empezar a utilizarlo añadiendo sus propiedades de datos directamente en esta página, o subiendo Formularios que lo utilicen. En este caso, cualquier propiedad que el Formulario llame se creará automáticamente cuando publiques el Formulario."
    ],
    "problem": {
      "409_3": "Ya existe una Lista de Entidades en este Proyecto con el nombre de “{datasetName}”."
    },
    "introduction": [
      "Las entidades le permiten compartir información entre formularios para que pueda recopilar datos longitudinales, gestionar casos a lo largo del tiempo y representar otros flujos de trabajo con varios pasos."
    ]
  },
  "fr": {
    "title": "Créer une liste d'Entités",
    "encrypted": "Ce projet est chiffré. Les soumissions de formulaires ne pourront pas modifier cette liste. Les entités doivent être gérées à partir de Central ou de l'interface de programmation (API).",
    "entityListName": "Nom de la Liste d'Entités",
    "success": [
      "La Liste d'Entités \"{name}\" a été créée.",
      "Vous pouvez commencer à l'utiliser en ajoutant ses propriétés directement sur cette page, ou en téléchargeant des formulaires qui l'utilisent. Dans ce cas, toutes les propriétés que le formulaire appelle seront automatiquement créées lorsque vous publierez le formulaire."
    ],
    "problem": {
      "409_3": "Une liste d'entité nommée \"{datasetName}\" existe déjà dans ce Projet."
    },
    "introduction": [
      "Les entités vous permettent de partager de l'information entre vos formulaires. Vous pouvez ainsi collecter des données longitudinales, suivre des cas dans le temps, et créer d'autres processus à multiples étapes."
    ]
  },
  "it": {
    "title": "Crea la Lista Entità",
    "encrypted": "Questo progetto è criptato. I formulari e gli invii non saranno in grado di modificare le entità di questo elenco. Le entità devono essere gestite tramite Central o l'API.",
    "entityListName": "Nome Lista Entità",
    "success": [
      "La Lista Entità \"{name}\" è stato creata.",
      "È possibile iniziare ad usarlo aggiungendo le proprietà dei dati direttamente in questa pagina o caricando i formulari che lo utilizzano. In questo caso, le proprietà richiamate dal formulario saranno create automaticamente quando si pubblica il modulo."
    ],
    "problem": {
      "409_3": "Esiste già un elenco di entità in questo progetto con il nome di “{datasetName}”."
    },
    "introduction": [
      "Le entità consentono di condividere le informazioni tra i formulari per raccogliere dati longitudinali, gestire i casi nel tempo e rappresentare altri flussi di lavoro con più passaggi."
    ]
  },
  "pt": {
    "title": "Criar lista de Entidades",
    "encrypted": "Este Projeto está encriptado. Formulários e Respostas não poderão modificar nenhuma Entidade nesta Lista. As Entidades devem ser gerenciadas por meio do Central ou da API.",
    "entityListName": "Nome da Lista de Entidades",
    "success": [
      "A Lista de Entidades “{name}” foi criada.",
      "Você pode começar a usá-la adicionando suas propriedades de dados diretamente nesta página ou carregando Formulários que a usam. Nesse caso, quaisquer propriedades que o Formulário chamar serão criadas automaticamente quando você publicar o Formulário."
    ],
    "problem": {
      "409_3": "Uma Lista de Entidades já existe neste Projeto com o nome de “{datasetName}”."
    },
    "introduction": [
      "As Entidades permitem que você compartilhe informações entre Formulários para que você possa coletar dados longitudinais, gerenciar casos ao longo do tempo e representar outros fluxos de trabalho com várias etapas."
    ]
  },
  "sw": {
    "introduction": [
      "Huluki hukuruhusu kushiriki maelezo kati ya Fomu ili uweze kukusanya data ya longitudinal, kudhibiti matukio baada ya muda, na kuwakilisha utendakazi mwingine kwa hatua nyingi."
    ]
  },
  "zh": {
    "title": "创建实体列表",
    "encrypted": "此项目已加密。表单及其提交数据将无法修改此列表中的任何实体。实体必须通过Central平台或API进行管理。",
    "entityListName": "实体列表名称",
    "success": [
      "实体列表“{name}”已成功创建。",
      "您可以直接在本页面添加数据属性来开始使用，也可通过上传调用该实体的表单来实现。若选择后者，当表单发布时，其引用的所有属性都将自动创建。"
    ],
    "problem": {
      "409_3": "该项目中已存在名称为{datasetName}的实体列表。"
    },
    "introduction": [
      "实体功能支持跨表单共享信息，便于您收集纵向数据、进行长期案例管理，以及实现多步骤工作流程。"
    ]
  },
  "zh-Hant": {
    "title": "建立實體列表",
    "encrypted": "該專案已加密。表格和提交內容將無法修改此清單中的任何實體。實體必須透過 Central 或 API 進行管理。",
    "entityListName": "實體清單名稱",
    "success": [
      "實體清單「{name}」已建立。",
      "您可以透過直接在此頁面上新增其資料屬性或上傳使用它的表單來開始使用它。在這種情況下，當您發布表單時，表單呼叫的任何屬性都會自動建立。"
    ],
    "problem": {
      "409_3": "該專案中已存在名稱為「{datasetName}」的實體清單。"
    },
    "introduction": [
      "實體清單允許您在表單之間共用資訊，以便收集縱向資料、隨時間管理案例，並透過多個步驟表示其他工作流程。"
    ]
  }
}
</i18n>
