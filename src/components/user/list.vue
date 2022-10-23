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
component that each user is assigned only one role and that further, each user
either is an Administrator or has no role. -->
<template>
  <div>
    <div class="heading-with-button">
      <button id="user-list-new-button" type="button" class="btn btn-primary"
        @click="showModal('newUser')">
        <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
      </button>
      <i18n-t tag="p" keypath="heading[0]">
        <template #collect>
          <doc-link to="collect-intro/">ODK Collect</doc-link>
        </template>
      </i18n-t>
    </div>
    <table id="user-list-table" class="table">
      <thead>
        <tr>
          <th>{{ $t('header.displayName') }}</th>
          <th>{{ $t('header.email') }}</th>
          <th>{{ $t('header.sitewideRole') }}</th>
          <th class="actions">{{ $t('header.actions') }}</th>
        </tr>
      </thead>
      <tbody v-if="dataExists">
        <user-row v-for="user of users" :key="user.id" :user="user"
          :admin="adminIds.has(user.id)" :highlighted="highlighted"
          @assigned-role="afterAssignRole" @reset-password="showResetPassword"
          @retire="showRetire"/>
      </tbody>
    </table>
    <loading :state="initiallyLoading"/>

    <user-new v-bind="newUser" @hide="hideModal('newUser')"
      @success="afterCreate"/>
    <user-reset-password v-bind="resetPassword" @hide="hideResetPassword"
      @success="afterResetPassword"/>
    <user-retire v-bind="retire" @hide="hideRetire" @success="afterRetire"/>
  </div>
</template>

<script>
import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import UserNew from './new.vue';
import UserResetPassword from './reset-password.vue';
import UserRetire from './retire.vue';
import UserRow from './row.vue';

import modal from '../../mixins/modal';
import { useRequestData } from '../../request-data';

export default {
  name: 'UserList',
  components: {
    DocLink,
    Loading,
    UserNew,
    UserResetPassword,
    UserRetire,
    UserRow
  },
  mixins: [modal()],
  inject: ['alert'],
  setup() {
    const { createResource, resourceStates } = useRequestData();
    const users = createResource('users');
    const adminIds = createResource('adminIds', () => ({
      transformResponse: ({ data }) =>
        data.reduce((set, actor) => set.add(actor.id), new Set())
    }));
    return { users, adminIds, ...resourceStates([users, adminIds]) };
  },
  data() {
    return {
      // The id of the highlighted user
      highlighted: null,
      // Modals
      newUser: {
        state: false
      },
      resetPassword: {
        state: false,
        user: null
      },
      retire: {
        state: false,
        user: null
      }
    };
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      Promise.allSettled([
        this.users.request({ url: '/v1/users' }),
        this.adminIds.request({ url: '/v1/assignments/admin' })
      ]);
    },
    afterCreate(user) {
      this.fetchData();
      this.hideModal('newUser');
      this.alert.success(this.$t('alert.create', user));
      this.highlighted = user.id;
    },
    // Called after a user is assigned a new role (including None).
    afterAssignRole(user, admin) {
      this.alert.success(this.$t('alert.assignRole', {
        displayName: user.displayName,
        roleName: admin ? this.$t('role.admin') : this.$t('role.none')
      }));

      /*
      Here we update this.adminIds. If the current user has also refreshed the
      data, then in rare cases, the update to this.adminIds will not be shown.
      For example:

        1. The current user changes another user's sitewide role.
        2. Immediately after, the user clicks the refresh button.
        3. The response for the role change is received first, updating
           this.adminIds.
        4. The response for the refresh is received, possibly undoing the
           update to this.adminIds.

      In cases like this, the current user will likely refresh Frontend or redo
      the change.
      */
      if (this.adminIds.dataExists) {
        if (admin) {
          this.adminIds.add(user.id);
        } else {
          this.adminIds.delete(user.id);
        }
      }
    },
    showResetPassword(user) {
      this.resetPassword.user = user;
      this.showModal('resetPassword');
    },
    hideResetPassword() {
      this.hideModal('resetPassword');
      this.resetPassword.user = null;
    },
    afterResetPassword(user) {
      this.hideResetPassword();
      this.hideModal('resetPassword');
      this.alert.success(this.$t('alert.resetPassword', user));
    },
    showRetire(user) {
      this.retire.user = user;
      this.showModal('retire');
    },
    hideRetire() {
      this.hideModal('retire');
      this.retire.user = null;
    },
    afterRetire(user) {
      this.fetchData();
      this.hideRetire();
      this.alert.success(this.$t('alert.retire', user));
      this.highlighted = null;
    }
  }
};
</script>

<style lang="scss">
#user-list-table {
  table-layout: fixed;

  th.actions { width: 125px; }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      "create": "Create Web User"
    },
    "heading": [
      // {collect} is a link whose text is "ODK Collect".
      "Web Users have accounts on this website to oversee and administer the Projects on this server. Administrators can manage anything on the site. Users with no Sitewide Role can be given a Role on any Project, from that Project’s settings. Sitewide Administrators and some Project Roles can use a web browser to fill out Forms. To submit data through an application such as {collect}, create App Users for each Project."
    ],
    "header": {
      "sitewideRole": "Sitewide Role"
    },
    "alert": {
      "create": "A user was created successfully for “{displayName}”.",
      "assignRole": "Success! “{displayName}” has been given a Sitewide Role of “{roleName}”.",
      "resetPassword": "The password for “{displayName}” has been invalidated. An email has been sent to {email} with instructions on how to proceed.",
      "retire": "The user “{displayName}” has been retired."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "create": "Vytvořit webového uživatele"
    },
    "heading": [
      "Weboví uživatelé mají na této webové stránce účty pro přehled a správu projektů na tomto serveru. Správci mohou na webu spravovat cokoli. Uživatelé bez role úplného přístupu mohou mít roli v jakémkoli projektu, z jeho Projektového nastavení. Administrátoři webu a některé role projektu mohou k vyplnění formulářů použít webový prohlížeč. Chcete-li odeslat data prostřednictvím aplikace, jako {collect} vytvořte uživatele aplikace pro každý projekt."
    ],
    "header": {
      "sitewideRole": "Role úplného přístupu"
    },
    "alert": {
      "create": "Uživatel byl úspěšně vytvořen pro „{displayName}“.",
      "assignRole": "Úspěch! „{displayName}“ získal roli úplného přístupu „{roleName}“.",
      "resetPassword": "Heslo pro „{displayName}“ bylo zneplatněno. Byl odeslán e-mail na {email} s pokyny, jak postupovat.",
      "retire": "Uživatel „{displayName}“ byl uspán."
    }
  },
  "de": {
    "action": {
      "create": "Web-Benutzer anlegen"
    },
    "heading": [
      "Web-Benutzer haben Konten auf dieser Webseite, um Projekte auf diesem Server zu überwachen und zu administrieren. Administratoren können alles auf dieser Seite verwalten. Benutzer ohne seitenweite Rolle können in jedem Projekt in den Projekteinstellungen eine Rolle zugewiesen bekommen. Seitenweite Administratoren und einige Projektrollen können einen Webbrowser zum Ausfüllen von Formularen benutzen. Um Daten über eine App wie {collect} zu übermitteln, erstellen Sie App-Benutzer für jedes Projekt."
    ],
    "header": {
      "sitewideRole": "Seitenweite Rolle"
    },
    "alert": {
      "create": "Ein Benutzer für \"{displayName}\" wurde erfolgreich erstellt.",
      "assignRole": "\"{displayName}\" wurde erfolgreich eine seitenweite Rolle als \"{roleName}\" zugewiesen.",
      "resetPassword": "Das Passwort für \"{displayName}\" wurde als ungültig gekennzeichnet. Eine E-Mail wurde an {email} gesendet mit Anweisungen wie weiter vorgegangen wird.",
      "retire": "Der App-Benutzer \"{displayName}\" wurde deaktiviert."
    }
  },
  "es": {
    "action": {
      "create": "Crear usuario web"
    },
    "heading": [
      "Los usuarios web tienen cuentas en este sitio web, para supervisar y administrar proyectos en el servidor. Los administradores pueden gestionar cualquier cosa en la página. Los usuarios que no poseen un Rol, se le puede asignar un Rol en configuración de proyecto. Los Administradores y algunos roles en el proyecto, pueden usar un explorador web para completar formularios. Para enviar la información a través de una aplicación tal como {collect}, cree Usuarios móviles en cada proyecto."
    ],
    "header": {
      "sitewideRole": "Rol de sitio"
    },
    "alert": {
      "create": "Se creó un usuario satisfactoriamente para “{displayName}”.",
      "assignRole": "Realizado. Al usuario \"{displayName}\" se le ha asignado el rol \" {roleName}\" en este proyecto.",
      "resetPassword": "La contraseña asociada al usuario {displayName} es incorrecta. Se ha enviado un correo electrónico a {email} con las instrucciones para continuar.",
      "retire": "El usuario \"{displayName}\" ha sido retirado"
    }
  },
  "fr": {
    "action": {
      "create": "Créer un utilisateur web"
    },
    "heading": [
      "Les utilisateurs web ont des comptes sur ce site pour superviser et administrer les projets sur ce serveur. Les administrateurs peuvent gérer tout ce qui se trouve sur le site. Les utilisateurs n'ayant aucun rôle sur l'ensemble du site peuvent toujours être nommés gestionnaires de projet pour n'importe quel projet, à partir des paramètres de ce projet. Les administrateurs sur l'ensemble du site et certains rôles de projet peuvent utiliser leurs navigateurs pour remplir des formulaires. Pour soumettre des données à travers une application telle que {collect}, créez des utilisateurs mobiles pour chaque projet."
    ],
    "header": {
      "sitewideRole": "Rôle sur l'ensemble du site"
    },
    "alert": {
      "create": "Un utilisateur a été créé avec succès pour \"{displayName}\".",
      "assignRole": "Succès ! \"{displayName}\" a reçu le rôle de \"{roleName}\" pour l'ensemble du site.",
      "resetPassword": "Le mot de passe pour \"{displayName}\" a été invalidé. Un courrier électronique a été envoyé à {email} avec des instructions sur la manière de procéder.",
      "retire": "L'utilisateur {displayName} a été supprimé."
    }
  },
  "id": {
    "action": {
      "create": "Buat Pengguna Web"
    },
    "heading": [
      "Pengguna Web memiliki akun di website ini untuk mengawasi dan mengelola Proyek pada server ini. Administrator dapat mengelola apapun di situs. Pengguna yang tidak memiliki Peran Seluruh Situs bisa diberikan Peran dalam Proyek apapun, melalui pengaturan Proyek tersebut. Administrator Seluruh Sirus dan beberapa Perak Proyek dapat menggunakan web browser untuk mengisi Formulir. Untuk mengirim data lewat aplikasi seperti {collect}, buat Pengguna Aplikasi untuk masing-masing Proyek."
    ],
    "header": {
      "sitewideRole": "Peran Seluruh Situs"
    },
    "alert": {
      "create": "Pengguna telah sukses dibuat untuk \"{displayName}\".",
      "assignRole": "Berhasil! \"{displayName}\" telah diberikan Peran Seluruh Situs oleh \"{roleName}\".",
      "resetPassword": "Kata sandi untuk \"{displayName}\" sudah tidak berlaku. Sebuah email tetang instruksi selanjutnya telah dikirimkan ke {email}.",
      "retire": "Pengguna {displayName} telah berhenti."
    }
  },
  "it": {
    "action": {
      "create": "Crea un Utente Web"
    },
    "heading": [
      "Gli Utenti Web hanno degli account su questo sito per supervisionare e amministrare i Progetti sul server. Gli amministratori possono gestire qualsiasi cosa sul sito. Agli utenti senza ruolo di supervisione e amministrazione può essere assegnato un ruolo su qualsiasi progetto, attraverso le impostazioni del progetto stesso. Gli amministratori del sito e alcuni ruoli del progetto possono utilizzare un browser Web per compilare i formulari. Per inviare dati tramite un'applicazione come {collect}, create degli Utenti app per ciascun progetto."
    ],
    "header": {
      "sitewideRole": "Ruolo per tutto il sito"
    },
    "alert": {
      "create": "Un utente è stato creato con successo per \"{displayName}\"",
      "assignRole": "Successo! A \"{displayName}\" è stato assegnato un ruolo di \"{roleName}\" in tutto il sito.",
      "resetPassword": "La password per \"{displayName}\" è stata invalidata. È stata inviata un'e-mail a {email} con le istruzioni su come procedere.",
      "retire": "L'utente \"{displayName}\" è stato ritirato."
    }
  },
  "ja": {
    "action": {
      "create": "Webユーザーの作成"
    },
    "heading": [
      "Webユーザーは、このサーバー上のプロジェクトを監督・管理するアカウントを保有します。管理者は、サイト内の全てを管理できます。プロジェクトの設定から「サーバーでの役割」が無いユーザーに対して、任意のプロジェクトの役割を付与できます。サーバーの管理者と一部のプロジェクトでの役割を持つ者は、Webブラウザーを使ってフォームを入力できます。{collect}などのアプリでデータを送信する場合は、プロジェクトごとにアプリユーザーを作成して下さい。"
    ],
    "header": {
      "sitewideRole": "サーバーでの役割"
    },
    "alert": {
      "create": "ユーザー\"{displayName}\"の作成に成功しました。",
      "assignRole": "成功です！\"{displayName}\"はサーバーでの役割\"{roleName}\"を与えられました。",
      "resetPassword": "\"{displayName}\"のパスワードが無効です。{email}宛に、今後の対応についての手続き方法を記載したメールが送信されました。",
      "retire": "ユーザー\"{displayName}\"を除外しました。"
    }
  },
  "sw": {
    "action": {
      "create": "Unda Mtumiaji wa Wavuti"
    },
    "heading": [
      "Watumiaji Wavuti wana akaunti kwenye tovuti hii ili kusimamia na kusimamia Miradi kwenye seva hii. Wasimamizi wanaweza kudhibiti chochote kwenye tovuti. Watumiaji wasio na Jukumu la Tovuti Pote wanaweza kupewa Jukumu kwenye Mradi wowote, kutoka kwa mipangilio ya Mradi huo. Wasimamizi wa Tovuti nzima na baadhi ya Majukumu ya Mradi wanaweza kutumia kivinjari cha wavuti kujaza Fomu. Ili kuwasilisha data kupitia programu kama vile {collect}, unda Watumiaji wa Programu kwa kila Mradi."
    ],
    "header": {
      "sitewideRole": "Jukumu la Tovuti nzima"
    },
    "alert": {
      "create": "Mtumiaji ameundwa kwa ajili ya \"{displayName}\".",
      "assignRole": "Mafanikio! \"{displayName}\" imepewa Jukumu la Eneo Lote la \"{roleName}\".",
      "resetPassword": "Nenosiri la \"{displayName}\" limebatilishwa. Barua pepe imetumwa kwa {email} ikiwa na maagizo ya jinsi ya kuendelea.",
      "retire": "Mtumiaji \"{displayName}\" amestaafu."
    }
  }
}
</i18n>
