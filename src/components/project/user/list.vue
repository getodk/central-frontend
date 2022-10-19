<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->

<!-- Although Backend supports more complex use cases, we assume in this
component that each user is assigned at most one role and that the only roles
are Project Manager, Project Viewer, and Data Collector. -->
<template>
  <div id="project-user-list">
    <div class="page-body-heading">
      <p>{{ $t('heading[0]') }}</p>
      <ul>
        <i18n-t tag="li" keypath="heading[1].full">
          <template #projectManagers>
            <strong>{{ $t('heading[1].projectManagers') }}</strong>
          </template>
        </i18n-t>
        <i18n-t tag="li" keypath="heading[2].full">
          <template #projectViewers>
            <strong>{{ $t('heading[2].projectViewers') }}</strong>
          </template>
        </i18n-t>
        <i18n-t tag="li" keypath="heading[3].full">
          <template #dataCollectors>
            <strong>{{ $t('heading[3].dataCollectors') }}</strong>
          </template>
        </i18n-t>
      </ul>
      <i18n-t tag="p" keypath="moreInfo.clickHere.full">
        <template #clickHere>
          <doc-link to="central-projects/#managing-project-roles">{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
        </template>
      </i18n-t>
    </div>
    <form id="project-user-list-search-form" class="form-inline"
      @submit.prevent>
      <label class="form-group">
        <input class="form-control" :value="q" :placeholder="searchLabel"
          :disabled="searchDisabled" autocomplete="off"
          @change="changeQ($event.target.value)">
        <!-- When search is disabled, we hide rather than disable this button,
        because Bootstrap does not have CSS for .close[disabled]. -->
        <button v-show="q !== '' && !searchDisabled" type="button" class="close"
          :aria-label="$t('action.clearSearch')" @click="clearSearch">
          <span aria-hidden="true">&times;</span>
        </button>
        <span class="form-label">{{ searchLabel }}</span>
      </label>
    </form>

    <table class="table">
      <thead>
        <tr>
          <th>{{ $t('header.user') }}</th>
          <th>{{ $t('header.projectRole') }}</th>
        </tr>
      </thead>
      <tbody v-if="roles.dataExists && tableAssignments.dataExists">
        <project-user-row v-for="assignment of tableAssignments"
          :key="assignment.actor.id" :assignment="assignment"
          @increment-count="incrementCount" @decrement-count="decrementCount"
          @change="afterAssignmentChange"/>
      </tbody>
    </table>
    <loading :state="initiallyLoading || searchAssignments.awaitingResponse"/>
    <p v-show="emptyMessage !== ''" class="empty-table-message">
      {{ emptyMessage }}
    </p>
  </div>
</template>

<script>
import DocLink from '../../doc-link.vue';
import Loading from '../../loading.vue';
import ProjectUserRow from './row.vue';

import { apiPaths } from '../../../util/request';
import { noop } from '../../../util/util';
import { useRequestData } from '../../../request-data';

export default {
  name: 'ProjectUserList',
  components: { DocLink, Loading, ProjectUserRow },
  inject: ['alert'],
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  setup() {
    const { currentUser, roles, projectAssignments, createResource, resourceStates } = useRequestData();
    // searchAssignments.data is an array that contains an assignment-like
    // object for each user returned for the search. roleId may be `null` for
    // one or more of these objects. searchAssignments is not updated after an
    // assignment change: it is a snapshot of assignments at the time of the
    // search.
    const searchAssignments = createResource('searchAssignments', () => ({
      transformResponse: ({ data }) => data.map(user => {
        const assignment = projectAssignments.find(a => a.actor.id === user.id);
        return assignment != null ? assignment : { actor: user, roleId: null };
      })
    }));
    return {
      currentUser, roles, projectAssignments, searchAssignments,
      ...resourceStates([roles, projectAssignments])
    };
  },
  data() {
    return {
      // Search term
      q: '',
      // The number of POST or DELETE requests in progress
      assignRequestCount: 0
    };
  },
  computed: {
    searchDisabled() {
      if (!this.dataExists) return true;
      /*
      We disable search while a POST or DELETE request is in progress. If the
      user cleared the search while a POST or DELETE was in progress, a new
      request for the project assignments would be sent. In that case, once the
      POST/DELETE was successful, we would have to find the element of
      this.projectAssignments to update -- and it might even be unclear whether
      we should update that element.
      */
      return this.assignRequestCount !== 0;
    },
    searchLabel() {
      return this.currentUser.can('user.list')
        ? this.$t('field.q.canList')
        : this.$t('field.q.cannotList');
    },
    // The assignments to show in the table
    tableAssignments() {
      return this.q !== '' ? this.searchAssignments : this.projectAssignments;
    },
    emptyMessage() {
      if (!(this.tableAssignments.dataExists && this.tableAssignments.length === 0))
        return '';
      return this.tableAssignments === this.projectAssignments
        ? this.$t('emptyTable')
        : this.$t('common.noResults');
    }
  },
  created() {
    this.fetchData(false);
  },
  methods: {
    fetchData(resend) {
      Promise.allSettled([
        this.roles.request({ url: '/v1/roles', resend: false }),
        this.projectAssignments.request({
          url: apiPaths.projectAssignments(this.projectId),
          extended: true,
          resend
        })
      ]);
    },
    clearSearch() {
      this.fetchData(true);
      this.q = '';
      this.searchAssignments.data = null;
    },
    search() {
      this.searchAssignments.request({ url: apiPaths.users({ q: this.q }) })
        .catch(noop);
    },
    changeQ(q) {
      this.q = q;
      if (this.q === '')
        this.clearSearch();
      else
        this.search();
    },
    incrementCount() {
      this.assignRequestCount += 1;
    },
    decrementCount() {
      this.assignRequestCount -= 1;
    },
    /*
    afterAssignmentChange() completes two tasks after an assignment change:

      1. Shows an alert about the change.
      2. Updates this.projectAssignments to reflect the change.
        - Note that this.searchAssignments is not similarly updated.
    */
    afterAssignmentChange(actor, role, deleteWithoutPost) {
      // Update this.projectAssignments.
      const index = this.projectAssignments
        .findIndex(assignment => assignment.actor.id === actor.id);
      // If `role` is `null`, then rather than remove the assignment from
      // this.projectAssignments, we set its roleId to `null`. That way, the
      // user will remain in the table until a new request is sent for
      // this.projectAssignments.
      const assignment = { actor, roleId: role != null ? role.id : null };
      if (index !== -1)
        this.projectAssignments[index] = assignment;
      else
        this.projectAssignments.push(assignment);

      // Show the alert.
      if (deleteWithoutPost) {
        this.alert.danger(this.$t('alert.unassignWithoutReassign', actor));
      } else if (role != null) {
        this.alert.success(this.$t('alert.assignRole', {
          displayName: actor.displayName,
          roleName: this.$t(`role.${role.system}`)
        }));
      } else {
        this.alert.success(this.$t('alert.unassignRole', actor));
      }
    }
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/variables';

#project-user-list-search-form .form-control {
  // Add padding so that the .close button does not overlay long input text.
  padding-right: 21px;
  width: 250px;
}

#project-user-list table {
  table-layout: fixed;
}
</style>

<i18n lang="json5">
{
  "en": {
    "heading": [
      // This text is shown above a list of Roles.
      "Sitewide Administrators are automatically considered Managers of every Project. Other Users can have Roles specific to this Project:",
      {
        // This text is shown in a list of Roles.
        "full": "{projectManagers} can perform any administrative task related to this Project and can fill Forms out in a web browser",
        "projectManagers": "Project Managers"
      },
      {
        // This text is shown in a list of Roles.
        "full": "{projectViewers} can access and download all Form data in this Project, but cannot make any changes to settings or data",
        "projectViewers": "Project Viewers"
      },
      {
        // This text is shown in a list of Roles.
        "full": "{dataCollectors} can fill Forms out in a web browser, but cannot view or change data or settings",
        "dataCollectors": "Data Collectors"
      }
    ],
    "action": {
      "clearSearch": "Clear search"
    },
    "field": {
      "q": {
        "canList": "Search for a user…",
        "cannotList": "Enter exact user email address…"
      }
    },
    "header": {
      "user": "User",
      "projectRole": "Project Role"
    },
    "emptyTable": "There are no users assigned to this Project yet. To add one, search for a user above.",
    "alert": {
      "unassignWithoutReassign": "Something went wrong. “{displayName}” has been removed from the Project.",
      "assignRole": "Success! “{displayName}” has been given a Role of “{roleName}” on this Project.",
      "unassignRole": "Success! “{displayName}” has been removed from this Project."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "heading": [
      "Administrátoři celého webu jsou automaticky považováni za manažery každého projektu. Ostatní uživatelé mohou mít role specifické pro tento projekt:",
      {
        "full": "{projectManagers} mohou provádět jakékoli administrativní úkoly související s tímto projektem a mohou vyplnit formuláře ve webovém prohlížeči",
        "projectManagers": "Projektoví manažeři"
      },
      {
        "full": "{projectViewers} mohou přistupovat a stahovat všechna data formuláře v tomto projektu, ale nemohou provádět žádné změny nastavení nebo dat",
        "projectViewers": "Prohlížeči Projektu"
      },
      {
        "full": "{dataCollectors} mohou vyplnit formuláře ve webovém prohlížeči, ale nemohou zobrazit ani změnit data nebo nastavení",
        "dataCollectors": "Sběrači dat"
      }
    ],
    "action": {
      "clearSearch": "Vymazat vyhledávání"
    },
    "field": {
      "q": {
        "canList": "Vyhledat uživatele…",
        "cannotList": "Zadejte přesnou e-mailovou adresu uživatele ..."
      }
    },
    "header": {
      "user": "Uživatel",
      "projectRole": "Role Projektu"
    },
    "emptyTable": "K tomuto projektu zatím nejsou přiřazeni žádní uživatelé. Chcete-li přidat jednoho, vyhledejte uživatele výše.",
    "alert": {
      "unassignWithoutReassign": "Něco se pokazilo. „{displayName}“ Byl z projektu odstraněn.",
      "assignRole": "Úspěch! Pro „{displayName}“ byla v tomto projektu udělena role „{roleName}“.",
      "unassignRole": "Úspěch! „{displayName}“ byl z tohoto projektu odstraněn."
    }
  },
  "de": {
    "heading": [
      "Seitenweite Administratoren sind automatisch Manager in jedem Projekt. Andere Benutzer können Rollen spezifisch für dieses Projekt haben:",
      {
        "full": "{projectManagers} können jede administrative Aufgabe im Zusammenhang mit diesem Projekt ausführen und können Formulare in einem Webbrowser ausfüllen.",
        "projectManagers": "Projekt-Manager"
      },
      {
        "full": "{projectViewers} können auf alle Formulardaten in diesem Projekt zugreifen und sie herunterladen, aber können keine Änderungen an Einstellungen oder Daten durchführen.",
        "projectViewers": "Projekt-Viewer"
      },
      {
        "full": "{dataCollectors} können Formulare in einem Webbrowser ausfüllen, aber können keine Daten oder Einstellungen anzeigen oder ändern.",
        "dataCollectors": "Datensammler"
      }
    ],
    "action": {
      "clearSearch": "Suche löschen"
    },
    "field": {
      "q": {
        "canList": "Suche nach einem Benutzer...",
        "cannotList": "Genaue Benutzer-E-Mail-Adresse eingeben..."
      }
    },
    "header": {
      "user": "Benutzer",
      "projectRole": "Projektrolle"
    },
    "emptyTable": "Es wurden noch keine Benutzer diesem Projekt zugewiesen. Um einen hinzuzufügen, suchen Sie oben nach einem Benutzer.",
    "alert": {
      "unassignWithoutReassign": "Irgendetwas hat nicht funktioniert. \"{displayName}\" wurde aus diesem Projekt entfernt.",
      "assignRole": "\"{displayName}\" wurde erfolgreich die Rolle eines \"{roleName}\" in diesem Projekt zugewiesen.",
      "unassignRole": "\"{displayName}\" wurde erfolgreich aus dem Projekt entfernt."
    }
  },
  "es": {
    "heading": [
      "Los administradores de todo el sitio se consideran automáticamente administradores de cada proyecto. Otros usuarios pueden tener roles específicos para este proyecto:",
      {
        "full": "{projectManagers} pueden realizar cualquier tarea administrativa relacionada con este proyecto y puede llenar formularios desde un navegador web",
        "projectManagers": "Administradores de proyecto"
      },
      {
        "full": "{projectViewers} puede acceder y descargar todos los datos del Formulario en este proyecto, pero no puede realizar ningún cambio en la configuración o los datos.",
        "projectViewers": "Visores de proyecto"
      },
      {
        "full": "{dataCollectors} pueden llenar formularios desde un navegador web, pero no pueden ver o cambiar datos o configuraciones",
        "dataCollectors": "Recolectores de datos"
      }
    ],
    "action": {
      "clearSearch": "Limpiar la búsqueda"
    },
    "field": {
      "q": {
        "canList": "Buscar un usuario...",
        "cannotList": "Ingrese el correo electrónico del usuario"
      }
    },
    "header": {
      "user": "Usuario",
      "projectRole": "Rol en el proyecto"
    },
    "emptyTable": "No se han asignado usuarios a este proyecto. Para agregar uno, busque un usuario en la parte superior.",
    "alert": {
      "unassignWithoutReassign": "Algo salió mal. \"{displayName}\" ha sido removido del proyecto",
      "assignRole": "A \"{displayName}\" se le ha asignado exitosamente el rol de \"{roleName}\" en este proyecto.",
      "unassignRole": "\"{displayName}\" ha sido removido exitosamente de este proyecto."
    }
  },
  "fr": {
    "heading": [
      "Les administrateurs sur l'ensemble du site sont automatiquement considérés comme gestionnaires de chaque projet. Les autres utilisateurs peuvent avoir des rôles spécifiques à ce projet:",
      {
        "full": "Les {projectManagers} peuvent exécuter toutes les tâches administratives liées à ce projet et peuvent remplir des formulaires depuis leurs navigateurs.",
        "projectManagers": "gestionnaires de projet"
      },
      {
        "full": "Les {projectViewers} ont accès aux données de tous les formulaires dans ce projet et peuvent les télécharger mais ne peuvent apporter aucunes modifications aux données ou paramètres.",
        "projectViewers": "lecteurs de projet"
      },
      {
        "full": "Les {dataCollectors} peuvent remplir des formulaires depuis leur navigateur mais n'ont aucun accès aux données ou paramètres du projet.",
        "dataCollectors": "collecteurs de données"
      }
    ],
    "action": {
      "clearSearch": "Effacer la recherche"
    },
    "field": {
      "q": {
        "canList": "Rechercher un utilisateur...",
        "cannotList": "Entrez l'adresse de courriel exacte de l'utilisateur..."
      }
    },
    "header": {
      "user": "Utilisateur",
      "projectRole": "Rôle dans le projet"
    },
    "emptyTable": "Il n'y a pas encore d'utilisateurs affectés à ce projet. Pour en ajouter un, recherchez un utilisateur ci-dessus.",
    "alert": {
      "unassignWithoutReassign": "Quelque chose a mal tourné. \"{displayName}\" a été retiré du projet.",
      "assignRole": "Succès ! \"{displayName}\" a reçu un rôle de \"{roleName}\" dans ce projet.",
      "unassignRole": "Succès ! “{displayName}” a été retiré de ce projet."
    }
  },
  "id": {
    "heading": [
      "Administrator seluruh situs akan secara otomatis dikenali sebagai Manajer dari setiap Proyek. Pengguna lainnya bisa memiliki Peran spesifik dalam Proyek ini:",
      {
        "full": "{projectManagers} bisa melakukan pekerjaan administratif apapun sehubungan dengan Proyek ini dan bisa mengisi formulir lewat web browser.",
        "projectManagers": "Manajer Proyek"
      },
      {
        "full": "{projectViewers} dapat mengakses dan mengunduh semua data formulir di Proyek ini, tetapi tidak bisa membuat perubahan terhadap pengaturan maupun data",
        "projectViewers": "Pemerhati Proyek"
      },
      {
        "full": "{dataCollectors} dapat mengisi formulir di web browser, tetapi tidak bisa melihat atau mengubah data atau pengaturan.",
        "dataCollectors": "Pengumpul Data"
      }
    ],
    "action": {
      "clearSearch": "Hapus pencarian"
    },
    "field": {
      "q": {
        "canList": "Cari pengguna...",
        "cannotList": "Masukkan email pengguna..."
      }
    },
    "header": {
      "user": "Pengguna",
      "projectRole": "Peran Proyek"
    },
    "emptyTable": "Belum ada Pengguna yang ditugaskan dalam Proyek ini. Untuk menambah Pengguna, cari nama Pengguna di atas.",
    "alert": {
      "unassignWithoutReassign": "Terjadi kesalahan. \"{displayName}\" sudah dihapus dari Proyek.",
      "assignRole": "Berhasil! \"{displayName}\" telah diberikan Peran sebagai \"{roleName}\" dalam Proyek ini.",
      "unassignRole": "Berhasil! \"{displayName}\" telah dihapus dari Proyek ini."
    }
  },
  "it": {
    "heading": [
      "Gli Amministratori di tutto il sito sono automaticamente considerati Responsabili di ogni Progetto. Altri utenti possono avere ruoli specifici per questo progetto:",
      {
        "full": "{projectManagers} possono eseguire qualsiasi attività amministrativa relativa a questo progetto e possono compilare formulari in un browser web",
        "projectManagers": "Responsabili del progetto"
      },
      {
        "full": "{projectViewers} possono accedere e scaricare tutti i dati del formulario di questo progetto, ma non possono apportare modifiche alle impostazioni o ai dati",
        "projectViewers": "Visualizzatori del progetto"
      },
      {
        "full": "{dataCollectors} possono compilare i formulari in un browser Web, ma non possono visualizzare o modificare i dati o le impostazioni",
        "dataCollectors": "Raccoglitori di dati"
      }
    ],
    "action": {
      "clearSearch": "Cancella ricerca"
    },
    "field": {
      "q": {
        "canList": "Cerca un utente...",
        "cannotList": "Inserisci l'esatto indirizzo email dell'utente..."
      }
    },
    "header": {
      "user": "Utente",
      "projectRole": "Ruolo del progetto"
    },
    "emptyTable": "Non ci sono ancora utenti assegnati a questo progetto. Per aggiungerne uno, cerca un utente sopra.",
    "alert": {
      "unassignWithoutReassign": "Qualcosa è andato storto. “{displayName}” è stato rimosso dal progetto.",
      "assignRole": "Successo! A \"{displayName}\" è stato assegnato un ruolo di \"{roleName}\" in questo progetto.",
      "unassignRole": "Successo! \"{displayName}\" è stato rimosso da questo progetto."
    }
  },
  "ja": {
    "heading": [
      "サーバー管理者は、自動的に全てのプロジェクトの管理者となります。その他のユーザーは、このプロジェクトに限定した役割を持つことができます。",
      {
        "full": "{projectManagers}は、このプロジェクトに関連するあらゆる管理作業を行うことができ、Webブラウザでフォームを入力できます。",
        "projectManagers": "プロジェクト・マネージャー"
      },
      {
        "full": "{projectViewers}は、このプロジェクトの全てのフォームにアクセスし、ダウンロードできますが、設定やデータの変更はできません。",
        "projectViewers": "プロジェクト・閲覧者"
      },
      {
        "full": "{dataCollectors}は、Webブラウザでフォームを入力できますが、データや設定を閲覧・変更はできません。",
        "dataCollectors": "データ収集者"
      }
    ],
    "action": {
      "clearSearch": "検索条件の解除"
    },
    "field": {
      "q": {
        "canList": "ユーザーの検索",
        "cannotList": "正確なユーザーのメールアドレスを入力する。"
      }
    },
    "header": {
      "user": "ユーザー",
      "projectRole": "プロジェクトでの役割"
    },
    "emptyTable": "このプロジェクトに割り当てられたユーザーはまだいません。ユーザーを追加するには、上の検索ボックスでユーザーを検索してください。",
    "alert": {
      "unassignWithoutReassign": "問題が発生しました 。\"{displayName}\"はプロジェクトから除外されました。",
      "assignRole": "成功です！\"{displayName}\"には、このプロジェクトで\"{roleName}\"の役割が割当てられました。",
      "unassignRole": "成功です！\"{displayName}\"はこのプロジェクトから除外されました。"
    }
  },
  "sw": {
    "heading": [
      "Wasimamizi wa Tovuti nzima wanazingatiwa kiotomatiki Wasimamizi wa kila Mradi. Watumiaji Wengine wanaweza kuwa na Majukumu mahususi kwa Mradi huu",
      {
        "full": "{projectManagers} inaweza kutekeleza kazi yoyote ya usimamizi inayohusiana na Mradi huu na inaweza kujaza Fomu katika kivinjari cha wavuti.",
        "projectManagers": "Wasimamizi wa Mradi"
      },
      {
        "full": "{projectViewers} inaweza kufikia na kupakua data yote ya Fomu katika Mradi huu, lakini haiwezi kufanya mabadiliko yoyote kwenye mipangilio au data",
        "projectViewers": "Watazamaji wa Mradi"
      },
      {
        "full": "{dataCollectors} inaweza kujaza Fomu katika kivinjari, lakini haiwezi kuona au kubadilisha data au mipangilio",
        "dataCollectors": "Wakusanyaji Data"
      }
    ],
    "action": {
      "clearSearch": "Futa utafutaji"
    },
    "field": {
      "q": {
        "canList": "Tafuta mtumiaji...",
        "cannotList": "Weka barua pepe kamili ya mtumiaji..."
      }
    },
    "header": {
      "user": "Mtumiaji",
      "projectRole": "Jukumu la Mradi"
    },
    "emptyTable": "Bado hakuna watumiaji waliokabidhiwa kwa Mradi huu. Ili kuongeza moja, tafuta mtumiaji hapo juu.",
    "alert": {
      "unassignWithoutReassign": "Hitilafu fulani imetokea. \"{displayName}\" imeondolewa kwenye Mradi.",
      "assignRole": "Mafanikio! \"{displayName}\" imepewa Jukumu la \"{roleName}\" kwenye Mradi huu.",
      "unassignRole": "Mafanikio! \"{displayName}\" imeondolewa kwenye Mradi huu."
    }
  }
}
</i18n>
