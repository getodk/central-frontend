<!--
Copyright 2025 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div class="panel panel-simple">
    <div class="panel-heading">
      <h1 class="panel-title">{{ $t('panel.title') }}</h1>
    </div>
    <div class="panel-body">
      <form @change="confirmationModal.show()" @submit.prevent>
        <div class="radio">
          <label>
            <input v-model="ownerOnly" type="radio" :value="false"
              aria-describedby="dataset-owner-only-false-help"
              :disabled="awaitingResponse">
            <strong>{{ $t('accessAllDefault') }}</strong>
          </label>
          <p id="dataset-owner-only-false-help" class="help-block">
            {{ $t('radio.false') }}
          </p>
        </div>
        <div class="radio">
          <label>
            <input v-model="ownerOnly" type="radio" :value="true"
              aria-describedby="dataset-owner-only-true-help"
              :disabled="awaitingResponse">
            <strong>{{ $t('ownerOnly') }}</strong>
          </label>
          <p id="dataset-owner-only-true-help" class="help-block">
            {{ $t('radio.true') }}
          </p>
        </div>
      </form>
    </div>
  </div>
  <modal v-bind="confirmationModal" :hideable="!awaitingResponse" backdrop
    @hide="cancel">
    <template #title>{{ ownerOnly ? $t('ownerOnly') : $t('accessAll') }}</template>
    <template #body>
      <p class="modal-introduction">
        {{ ownerOnly ? $t('trueModal.introduction') : $t('falseModal.introduction') }}
      </p>
      <div class="modal-actions">
        <button type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="cancel">
          {{ $t('action.cancel') }}
        </button>
        <button type="button" class="btn btn-primary"
          :aria-disabled="awaitingResponse" @click="confirm">
          {{ ownerOnly ? $t('trueModal.action.confirm') : $t('accessAll') }}
          <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { inject, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';

defineOptions({
  name: 'DatasetOwnerOnly'
});

const { t } = useI18n();
const { alert } = inject('container');

// The component assumes that this data will exist when the component is
// created.
const { dataset } = useRequestData();

const ownerOnly = ref(false);
watch(
  () => dataset.dataExists,
  (dataExists) => { if (dataExists) ownerOnly.value = dataset.ownerOnly; },
  { immediate: true }
);

const confirmationModal = modalData();
const cancel = () => {
  confirmationModal.hide();
  ownerOnly.value = !ownerOnly.value;
};

const { request, awaitingResponse } = useRequest();
const update = async (value) => {
  const { data } = await request({
    method: 'PATCH',
    url: apiPaths.dataset(dataset.projectId, dataset.name),
    data: { ownerOnly: value }
  });
  dataset.ownerOnly = data.ownerOnly;
};
const undo = () => update(!ownerOnly.value)
  .then(() => {
    ownerOnly.value = !ownerOnly.value;
    return true;
  })
  .catch(noop);
const confirm = () => update(ownerOnly.value)
  .then(() => {
    confirmationModal.hide();
    const message = dataset.ownerOnly
      ? t('alert.changeToTrue')
      : t('alert.changeToFalse');
    alert.success(message).cta(t('action.undo'), undo);
  })
  .catch(noop);
</script>

<i18n lang="json5">
{
  "en": {
    "panel": {
      // This is a title shown above a section of the page.
      "title": "App User and Data Collector Entity Access"
    },
    "accessAll": "Access all Entities",
    "accessAllDefault": "Access all Entities (default)",
    "ownerOnly": "Only access own Entities",
    "radio": {
      "false": "App Users and Data Collectors within this Project will have access to all Entities within their assigned Forms.",
      "true": "App Users and Data Collectors within this Project will only have access to the Entities they create, promoting privacy and limiting data transfers."
    },
    "falseModal": {
      "introduction": "App Users and Data Collectors will have access to all Entities, including ones they did not create."
    },
    "trueModal": {
      "introduction": "App Users and Data Collectors will lose access to the Entities they have not created. All other user types keep access to all Entities.",
      "action": {
        "confirm": "Access own Entities"
      }
    },
    "alert": {
      "changeToFalse": "App Users and Data Collectors will now have access to all Entities.",
      "changeToTrue": "App Users and Data Collectors will now only have access to Entities they create."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "panel": {
      "title": "App-Benutzer und Datensammler-Objekt Zugriff"
    },
    "accessAll": "Zugriff auf alle Objekte",
    "accessAllDefault": "Zugriff auf alle Objekte (Standard)",
    "ownerOnly": "Nur auf eigene Objekte zugreifen",
    "radio": {
      "false": "App-Benutzer und Datenerfasser innerhalb dieses Projekts haben Zugriff auf alle Objekte innerhalb der ihnen zugewiesenen Formulare.",
      "true": "App-Benutzer und Datensammler innerhalb dieses Projekts haben nur Zugriff auf die Objekte, die sie selbst erstellen. Dies fördert den Datenschutz und begrenzt die Datenübertragungen."
    },
    "falseModal": {
      "introduction": "App-Benutzer und Datensammler haben Zugriff auf alle Objekte, einschließlich derjenigen, die sie nicht selbst erstellt haben."
    },
    "trueModal": {
      "introduction": "App-Benutzer und Datensammler verlieren den Zugriff auf die Objekte, die sie nicht selbst erstellt haben. Alle anderen Benutzertypen behalten den Zugriff auf alle Objekte.",
      "action": {
        "confirm": "Zugriff auf eigene Objekte"
      }
    },
    "alert": {
      "changeToFalse": "App-Nutzer und Datensammler haben nun Zugang zu allen Objekte.",
      "changeToTrue": "App-Benutzer und Datensammler haben nun nur noch Zugriff auf die Objekte, die sie selbst erstellen."
    }
  },
  "es": {
    "panel": {
      "title": "Acceso a la entidad del Usuario de la aplicación y recopilador de datos"
    },
    "accessAll": "Acceder a todas las entidades",
    "accessAllDefault": "Acceder a todas las Entidades (por defecto)",
    "ownerOnly": "Acceder sólo a Entidades propias",
    "radio": {
      "false": "Los usuarios de la aplicación y los recopiladores de datos de este proyecto tendrán acceso a todas las entidades de sus formularios asignados.",
      "true": "Los usuarios de la aplicación y los recopiladores de datos dentro de este proyecto sólo tendrán acceso a las entidades que creen, promoviendo la privacidad y limitando las transferencias de datos."
    },
    "falseModal": {
      "introduction": "Los usuarios de la aplicación y los recopiladores de datos tendrán acceso a todas las entidades, incluidas las que no hayan creado."
    },
    "trueModal": {
      "introduction": "Los usuarios de aplicaciones y los recopiladores de datos perderán el acceso a las entidades que no hayan creado. Todos los demás tipos de usuario conservan el acceso a todas las Entidades.",
      "action": {
        "confirm": "Acceso a entidades propias"
      }
    },
    "alert": {
      "changeToFalse": "Los usuarios de la aplicación y los recopiladores de datos tendrán ahora acceso a todas las entidades.",
      "changeToTrue": "Los usuarios de la aplicación y los recopiladores de datos ahora sólo tendrán acceso a las entidades que creen."
    }
  },
  "fr": {
    "panel": {
      "title": "Accès d'entités pour les utilisateurs mobiles et les collecteurs de données web"
    },
    "accessAll": "Accès à toutes les entités",
    "accessAllDefault": "Accès à toutes les entités (défaut)",
    "ownerOnly": "Accès uniquement à ses propres entités",
    "radio": {
      "false": "Les utilisateurs mobiles et les collecteurs de données web de ce projet auront accès à toutes les entités à partir des formulaires qu'ils leur sont assignés.",
      "true": "Les utilisateurs mobiles et les collecteurs de données web de ce projet n'auront accès qu'aux entités qu'ils ont créées. Ceci encourage la confidentialité et limite les transferts de données."
    },
    "falseModal": {
      "introduction": "Les utilisateurs mobiles et le collecteurs de données web auront accès à toutes les entités, incluant celles créées par d'autres utilisateurs."
    },
    "trueModal": {
      "introduction": "Les utilisateurs mobiles et les collecteurs de données web perdront accès aux entités crées par d'autres utilisateurs. Tous les autres utilisateurs garderont accès à toutes les entités.",
      "action": {
        "confirm": "Accéder propres entités"
      }
    },
    "alert": {
      "changeToFalse": "Les utilisateurs mobiles et les collecteurs de données web auront maintenant accès à toutes les entités.",
      "changeToTrue": "Les utilisateurs mobiles et les collecteurs de données web auront maintenant accès seulement aux entités qu'ils ont créées."
    }
  },
  "it": {
    "panel": {
      "title": "Accesso dell'utente dell'app e del raccoglitore di dati alla Entità"
    },
    "accessAll": "Accedi a tutte le entità",
    "accessAllDefault": "Accedi a tutte le entità (predefinito)",
    "ownerOnly": "Accedere solo alle proprie entità",
    "radio": {
      "false": "Gli utenti delle app e i raccoglitori di dati nell'ambito di questo progetto avranno accesso a tutte le entità all'interno dei moduli loro assegnati.",
      "true": "Gli utenti dell'app e i raccoglitori di dati nell'ambito di questo progetto avranno accesso solo alle entità da loro create, promuovendo la privacy e limitando i trasferimenti di dati."
    },
    "falseModal": {
      "introduction": "Gli utenti dell'app e i raccoglitori di dati avranno accesso a tutte le entità, comprese quelle che non hanno creato."
    },
    "trueModal": {
      "introduction": "Gli utenti delle app e i raccoglitori di dati perderanno l'accesso alle entità che non hanno creato. Tutti gli altri tipi di utenti mantengono l'accesso a tutte le Entità.",
      "action": {
        "confirm": "Accedere alle proprie entità"
      }
    },
    "alert": {
      "changeToFalse": "Gli utenti dell'app e i raccoglitori di dati avranno ora accesso a tutte le entità.",
      "changeToTrue": "Gli utenti delle app e i raccoglitori di dati avranno ora accesso solo alle entità da loro create."
    }
  },
  "pt": {
    "panel": {
      "title": "Acesso a Entidades para Usuários de Aplicativo e Coletores de Dados"
    },
    "accessAll": "Acessa todas as Entidades",
    "accessAllDefault": "Acessa todas as Entidades (padrão)",
    "ownerOnly": "Acessa apenas suas próprias Entidades",
    "trueModal": {
      "action": {
        "confirm": "Acessar Entidades Próprias"
      }
    }
  },
  "zh": {
    "panel": {
      "title": "App用户与数据收集者实体权限"
    },
    "accessAll": "访问所有实体",
    "accessAllDefault": "访问所有实体（默认）",
    "ownerOnly": "仅访问自己的实体",
    "radio": {
      "false": "本项目内的App用户和数据收集员将可通过其被分配的表单访问所有相关实体。",
      "true": "本项目中的应用用户和数据收集员只能访问他们自己创建的实体，以促进隐私保护并限制数据传输。"
    },
    "falseModal": {
      "introduction": "App用户和数据收集者拥有访问实体的权限，包括他们未建立的实体。"
    },
    "trueModal": {
      "introduction": "App用户和数据收集者将失去对非本人创建实体的访问权限。其他类型的用户仍可访问所有实体。",
      "action": {
        "confirm": "访问本人创建的实体"
      }
    },
    "alert": {
      "changeToFalse": "App使用者和数据收集者现在可以访问所有的实体。",
      "changeToTrue": "App使用者和数据收集者现在只能访问他们创建的实体。"
    }
  },
  "zh-Hant": {
    "panel": {
      "title": "應用程式使用者和資料收集器實體存取"
    },
    "accessAll": "存取所有實體",
    "accessAllDefault": "存取所有實體 (預設)",
    "ownerOnly": "僅存取自己的實體",
    "radio": {
      "false": "此專案中的 App 使用者和資料收集者將可存取其指定表單中的所有實體。",
      "true": "此專案中的 App 使用者和資料收集者僅能存取他們所建立的實體，以促進隱私權並限製資料傳輸。"
    },
    "falseModal": {
      "introduction": "App 使用者和資料收集者將可存取所有實體，包括他們未建立的實體。"
    },
    "trueModal": {
      "introduction": "App 使用者和資料收集者將失去對他們未建立的實體的存取權。所有其他使用者類型則保留對所有實體的存取權。",
      "action": {
        "confirm": "存取自己的實體"
      }
    },
    "alert": {
      "changeToFalse": "App 使用者和資料收集者現在可以存取所有實體。",
      "changeToTrue": "App 使用者和資料收集者現在只能存取他們所建立的實體。"
    }
  }
}
</i18n>
