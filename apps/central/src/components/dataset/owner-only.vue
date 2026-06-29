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
  <div id="dataset-owner-only" class="panel panel-simple">
    <div class="panel-heading">
      <h1 class="panel-title">{{ $t('panel.title') }}</h1>
    </div>
    <div class="panel-body">
      <form v-if="actorProperties.dataExists" @change="openModal" @submit.prevent>
        <div class="radio">
          <label>
            <input v-model="accessType" type="radio" value="all"
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
            <input v-model="accessType" type="radio" value="ownerOnly"
              aria-describedby="dataset-owner-only-true-help"
              :disabled="awaitingResponse">
            <strong>{{ $t('ownerOnly') }}</strong>
          </label>
          <p id="dataset-owner-only-true-help" class="help-block">
            {{ $t('radio.true') }}
          </p>
        </div>
        <div class="radio" :class="{ disabled: filterByPropertyDisabled }"
          v-tooltip.no-aria="filterByPropertyDisabled ? disabledReason : null">
          <label>
            <input v-model="accessType" type="radio" value="property"
              aria-describedby="dataset-filter-by-property-help"
              :disabled="awaitingResponse || filterByPropertyDisabled">
            <strong>{{ $t('filterByProperty.label') }}</strong>
          </label>
          <p id="dataset-filter-by-property-help" class="help-block">
            {{ $t('filterByProperty.description') }}
          </p>
          <p v-if="dataset.accessFilter?.type === 'property'" class="current-filter-rule">
            <i18n-t keypath="filterByProperty.currentRule">
              <template #entityProperty>
                <strong>{{ dataset.accessFilter.rules[0].datasetProperty }}</strong>
              </template>
              <template #userProperty>
                <strong>{{ dataset.accessFilter.rules[0].actorProperty }}</strong>
              </template>
            </i18n-t>
            <button type="button" class="btn btn-link" @click="openModal">
              {{ $t('action.change') }}
            </button>
          </p>
        </div>
      </form>
      <loading :state="actorProperties.initiallyLoading"/>
    </div>
  </div>
  <modal v-bind="confirmationModal" :hideable="!awaitingResponse" backdrop
    @hide="cancel">
    <template #title>
      <template v-if="accessType === 'all'">
        {{ $t('accessAll') }}
      </template>
      <template v-else-if="accessType === 'ownerOnly'">
        {{ $t('ownerOnly') }}
      </template>
      <template v-else>
        {{ $t('accessByFilterRule.title') }}
      </template>
    </template>
    <template #body>
      <p class="modal-introduction">
        <template v-if="accessType === 'all'">
          {{ $t('falseModal.introduction') }}
        </template>
        <template v-else-if="accessType === 'ownerOnly'">
          {{ $t('trueModal.introduction') }}
        </template>
        <template v-else>
          {{ $t('accessByFilterRule.introduction') }}
        </template>
      </p>
      <form v-if="accessType === 'property'" id="property-filter-form"
        class="filter-by-property-selects" @submit.prevent="confirm">
        <label class="filter-select-label">
          {{ $t('filterByProperty.entityPropertyLabel') }}
          <select v-model="selectedEntityProperty"
            class="form-control" :disabled="awaitingResponse" required>
            <option value="" disabled>
              {{ $t('filterByProperty.entityPropertyPlaceholder') }}
            </option>
            <option v-for="property of dataset.properties" :key="property.name"
              :value="property.name">
              {{ property.name }}
            </option>
          </select>
        </label>
        <label class="filter-select-label">
          {{ $t('filterByProperty.userPropertyLabel') }}
          <select v-model="selectedUserProperty"
            class="form-control" :disabled="awaitingResponse" required>
            <option value="" disabled>
              {{ $t('filterByProperty.userPropertyPlaceholder') }}
            </option>
            <option v-for="property of actorProperties" :key="property.name"
              :value="property.name">
              {{ property.name }}
            </option>
          </select>
        </label>
      </form>
      <div class="modal-actions">
        <button type="button" class="btn btn-link"
          :aria-disabled="awaitingResponse" @click="cancel">
          {{ $t('action.cancel') }}
        </button>
        <button v-if="accessType === 'property'" type="submit"
          form="property-filter-form" class="btn btn-primary"
          :aria-disabled="awaitingResponse">
          {{ $t('accessByFilterRule.action.save') }}
          <spinner :state="awaitingResponse"/>
        </button>
        <button v-else type="button" class="btn btn-primary"
          :aria-disabled="awaitingResponse" @click="confirm">
          {{ accessType === 'all' ? $t('accessAll') : $t('trueModal.action.confirm') }}
          <spinner :state="awaitingResponse"/>
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import Modal from '../modal.vue';
import Spinner from '../spinner.vue';

import useRequest from '../../composables/request';
import { apiPaths } from '../../util/request';
import { modalData } from '../../util/reactivity';
import { noop } from '../../util/util';
import { useRequestData } from '../../request-data';
import Loading from '../loading.vue';

defineOptions({
  name: 'DatasetOwnerOnly'
});

const { t } = useI18n();
const { alert } = inject('container');

// The component assumes that this data will exist when the component is
// created.
const { dataset, actorProperties } = useRequestData();
const { request, awaitingResponse } = useRequest();

// Create and fetch actorProperties for this component
actorProperties.request({
  url: apiPaths.actorProperties(dataset.projectId),
  resend: false
}).catch(noop);

const hasDatasetProperties = computed(() => dataset.properties.length > 0);
const hasActorProperties = computed(() => actorProperties.length > 0);

const filterByPropertyDisabled = computed(() =>
  !hasDatasetProperties.value || !hasActorProperties.value);

const disabledReason = computed(() => {
  if (!hasDatasetProperties.value && !hasActorProperties.value)
    return t('filterByProperty.disabled.both');
  if (!hasDatasetProperties.value)
    return t('filterByProperty.disabled.datasetProperties');
  if (!hasActorProperties.value)
    return t('filterByProperty.disabled.userProperties');
  return null;
});

const accessType = ref(dataset.accessFilter?.type ?? 'all');

const selectedEntityProperty = ref('');
const selectedUserProperty = ref('');

const confirmationModal = modalData();
const populateDropdowns = () => {
  const [rule] = dataset.accessFilter?.rules ?? [];
  if (rule != null) {
    selectedEntityProperty.value = rule.datasetProperty;
    selectedUserProperty.value = rule.actorProperty;
  } else {
    selectedEntityProperty.value = '';
    selectedUserProperty.value = '';
  }
};
const openModal = () => {
  populateDropdowns();
  confirmationModal.show();
};
const cancel = () => {
  confirmationModal.hide();
  accessType.value = dataset.accessFilter?.type ?? 'all';
};

let previousAccessFilter = null;

const update = async (accessFilter) => {
  const { data } = await request({
    method: 'PATCH',
    url: apiPaths.dataset(dataset.projectId, dataset.name),
    data: { accessFilter }
  });

  previousAccessFilter = dataset.accessFilter;
  Object.assign(dataset.data, { accessFilter: null }, data);
};

const undo = () => {
  const newAccessType = previousAccessFilter?.type ?? 'all';
  return update(previousAccessFilter)
    .then(() => {
      accessType.value = newAccessType;
      return true;
    })
    .catch(noop);
};

const confirm = () => {
  const accessFilter = accessType.value === 'all' ? null : { type: accessType.value };
  if (accessType.value === 'property') {
    accessFilter.rules = [{
      datasetProperty: selectedEntityProperty.value,
      actorProperty: selectedUserProperty.value
    }];
  }

  return update(accessFilter)
    .then(() => {
      confirmationModal.hide();
      let message;
      if (dataset.accessFilter?.type === 'property') {
        message = t('alert.changeToProperty');
      } else if (dataset.accessFilter?.type === 'ownerOnly') {
        message = t('alert.changeToTrue');
      } else {
        message = t('alert.changeToFalse');
      }
      alert.success(message).cta(t('action.undo'), undo);
    })
    .catch(noop);
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#dataset-owner-only {
  .current-filter-rule {
    margin-top: -10px;
    margin-left: 20px;
  }
}

.filter-by-property-selects {
  display: flex;
  flex-direction: row;
  gap: 20px;
}

.filter-select-label {
  flex-basis: 50%;
  font-size: 12px;

  .form-control {
    margin-top: 5px;
    font-weight: normal;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "panel": {
      // This is a title shown above a section of the page.
      "title": "Entity List Access"
    },
    "accessAll": "Access all Entities",
    "accessAllDefault": "Access all Entities (default)",
    "ownerOnly": "Only access own Entities",
    "radio": {
      "false": "App Users and Data Collectors within this Project will have access to all Entities within their assigned Forms.",
      "true": "App Users and Data Collectors within this Project will only have access to the Entities they create, promoting privacy and limiting data transfers."
    },
    "filterByProperty": {
      "label": "Filter by Property",
      "description": "Define rules for which Entities are visible to App Users and Public Links by comparing their properties.",
      // This text is shown above the access rule filter dropdown. Translators are free not to translate this literally
      "entityPropertyLabel": "Only see Entities where",
      // Placeholder text shown on a access rule filter dropdown.
      "entityPropertyPlaceholder": "Entity property",
      // This text is shown above the access rule filter dropdown. Translators are free not to translate this literally
      "userPropertyLabel": "is equal to the user‘s",
      // Placeholder text shown on a access rule filter dropdown
      "userPropertyPlaceholder": "User property",
      "disabled": {
        "datasetProperties": "There are no Entity properties defined.",
        "userProperties": "There are no Custom Properties defined.",
        "both": "There are no Entity or user properties defined."
      },
      // {entityProperty} is the name of an Entity property. {userProperty} is the name of a User property.
      "currentRule": "Rule: {entityProperty} (Entity property) = {userProperty} (User property)"
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
      "changeToTrue": "App Users and Data Collectors will now only have access to Entities they create.",
      "changeToProperty": "App Users and Public Links will now only have access to Entities matching the filter rule."
    },
    "accessByFilterRule": {
      "title": "Filter by Property",
      "introduction": "App Users and Public Links will only have access to Entities where the selected property matches their user property.",
      "action": {
        "save": "Save Filter Rule"
      }
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
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
      "title": "Accès aux listes d'entités"
    },
    "accessAll": "Accès à toutes les entités",
    "accessAllDefault": "Accès à toutes les entités (défaut)",
    "ownerOnly": "Accès uniquement à ses propres entités",
    "radio": {
      "false": "Les utilisateurs mobiles et les collecteurs de données web de ce projet auront accès à toutes les entités à partir des formulaires qu'ils leur sont assignés.",
      "true": "Les utilisateurs mobiles et les collecteurs de données web de ce projet n'auront accès qu'aux entités qu'ils ont créées. Ceci encourage la confidentialité et limite les transferts de données."
    },
    "filterByProperty": {
      "label": "Filtrer par propriété",
      "description": "Définissez des règles déterminant quelles entités sont visibles pour les utilisateurs mobiles et via les liens publics, en comparant leurs propriétés.",
      "entityPropertyLabel": "Voir seulement les entités pour lesquelles",
      "entityPropertyPlaceholder": "Propriété d'entité",
      "userPropertyLabel": "est égale à cette propriété de l'utilisateur",
      "userPropertyPlaceholder": "Propriété d'utilisateur",
      "disabled": {
        "datasetProperties": "Pas de propriétés d'entités définies.",
        "userProperties": "Pas de propriétés d'utilisateur définies.",
        "both": "Il n'y a pas de propriétés d'entités ou de propriétés d'utilisateur définies."
      },
      "currentRule": "Règle: {entityProperty} (propriété d'entité) = {userProperty} (propriété d'utilisateur)"
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
      "changeToTrue": "Les utilisateurs mobiles et les collecteurs de données web auront maintenant accès seulement aux entités qu'ils ont créées.",
      "changeToProperty": "Les utilisateurs mobiles et les liens publics n'auront maintenant accès qu'aux entités correspondant à la règle de filtrage."
    },
    "accessByFilterRule": {
      "title": "Filtrer par propriété",
      "introduction": "Les utilisateurs mobiles et les liens publics n'auront maintenant accès qu'aux entités dont la propriété sélectionnée correspond à leur propriété d'utilisateur.",
      "action": {
        "save": "Sauvegarder la règle de filtrage."
      }
    }
  },
  "it": {
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
