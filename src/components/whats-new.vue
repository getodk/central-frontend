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
  <modal :state="isVisible" backdrop :hideable="true" @hide="hideModal">
    <template #banner>
      <img
        srcset="../assets/images/whats-new/banner@1x.png, ../assets/images/whats-new/banner@2x.png 2x"
        src="../assets/images/whats-new/banner@1x.png"
        alt="Modal banner image showing Create a New Draft button with arrow pointing to Edit Form tab.">
    </template>
    <template #title>{{ $t('title') }}</template>
    <template #body>
      <p class="modal-introduction">
        {{ $t('body') }}
      </p>
      <div class="modal-actions">
        <button type="button" class="btn btn-primary"
          @click="hideModal">
          {{ $t('action.gotIt') }}
        </button>
      </div>
    </template>
  </modal>
</template>

<script setup>
import { inject, ref, watch } from 'vue';

import Modal from './modal.vue';

import { useRequestData } from '../request-data';

defineOptions({
  name: 'WhatsNew'
});

const { openModal } = inject('container');
const { currentUser, projects } = useRequestData();

const isVisible = ref(false);

watch(() => projects.dataExists, () => {
  const canUpdateForm = currentUser.can('form.update') ||
    projects.data.some(project => project.verbs.has('form.update'));
  if (canUpdateForm && // Check that user is admin or is able to edit forms in at least one project
    new Date(currentUser.data.createdAt) < new Date('2025-05-06') && // Check that user was created prior to 2025.1 release (approx)
    !openModal.state && // Check that no other modal (e.g. new project) is open
    !currentUser.preferences.site.whatsNewDismissed2025_1) {
    isVisible.value = true;
  }
});

function hideModal() {
  currentUser.preferences.site.whatsNewDismissed2025_1 = true;
  isVisible.value = false;
}

</script>

<i18n lang="json5">
  {
    "en": {
      // This is the title at the top of a pop-up.
      "title": "Form drafts have moved",
      "body": "Create a new Form and edit it on the new Edit Form tab",
      "action": {
        // This is the text of a button that is used to close the modal.
        "gotIt": "Got it!"
      }
    }
  }
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "de": {
    "title": "Formularentwürfe wurden verschoben",
    "body": "Erstellen Sie ein neues Formular und bearbeiten Sie es auf der neuen Registerkarte Formular bearbeiten",
    "action": {
      "gotIt": "Ich hab's!"
    }
  },
  "es": {
    "title": "Los borradores de formularios se han trasladado",
    "body": "Cree un nuevo formulario y edítelo en la nueva pestaña Editar formulario",
    "action": {
      "gotIt": "¡Ya está!"
    }
  },
  "fr": {
    "title": "Les ébauches de Formulaires ont été déplacées.",
    "body": "Créez un nouveau Formulaire et éditez le dans le nouvel onglet «Éditer le Formulaire»",
    "action": {
      "gotIt": "J'ai compris !"
    }
  },
  "it": {
    "title": "Le bozze dei formulari sono state spostate",
    "body": "Creare un nuovo formulario e modificarlo nella nuova scheda Modifica del formulario.",
    "action": {
      "gotIt": "Capito!"
    }
  },
  "pt": {
    "action": {
      "gotIt": "Entendi!"
    }
  },
  "zh-Hant": {
    "title": "表單草稿已移動",
    "body": "建立新表單，並在新的「編輯表單」標籤上編輯它",
    "action": {
      "gotIt": "知道了！"
    }
  }
}
</i18n>
