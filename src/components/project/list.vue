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
<template>
  <div id="project-list">
    <page-section>
      <template #heading>
        <span>{{ $t('resource.projects') }}</span>
        <button v-if="currentUser.can('project.create')"
          id="project-list-new-button" type="button" class="btn btn-primary"
          @click="showModal('newProject')">
          <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
        </button>
        <project-sort v-model="sortMode"/>
      </template>
      <template #body>
        <div v-if="projects != null">
          <project-home-block v-for="project of activeProjects" :key="project.id"
            :project="project" :sort-func="sortFunction"/>
        </div>
        <loading :state="$store.getters.initiallyLoading(['projects'])"/>
        <p v-if="projects != null && projects.length === 0"
          class="empty-table-message">
          {{ $t('emptyTable') }}
        </p>
      </template>
    </page-section>
    <page-section v-if="archivedProjects.length > 0">
      <template #heading>
        <span>{{ $t('archived') }}</span>
      </template>
      <template #body>
        <div id="project-list-archived">
          <div v-for="project of archivedProjects" :key="project.id">
            <div class="project-title">
              <router-link :to="projectPath(project.id)">{{ project.name }}</router-link>
            </div>
          </div>
        </div>
      </template>
    </page-section>
    <project-new v-bind="newProject" @hide="hideModal('newProject')"
      @success="afterCreate"/>
  </div>
</template>

<script>
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import ProjectNew from './new.vue';
import ProjectHomeBlock from './home-block.vue';
import ProjectSort from './sort.vue';

import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectList',
  components: {
    Loading,
    PageSection,
    ProjectNew,
    ProjectHomeBlock,
    ProjectSort
  },
  mixins: [modal(), routes()],
  inject: ['alert'],
  data() {
    return {
      newProject: {
        state: false
      },
      sortMode: 'latest'
    };
  },
  computed: {
    ...requestData(['currentUser', 'projects']),
    sortFunction() {
      const sortFunctions = {
        alphabetical: (a, b) => {
          // sort uses `name` field for both projects and forms
          // but some forms don't have a name
          const nameA = a.name != null ? a.name : a.nameOrId();
          const nameB = b.name != null ? b.name : b.nameOrId();
          return nameA.localeCompare(nameB);
        },
        latest: (a, b) => {
          const dateA = a.lastSubmission;
          const dateB = b.lastSubmission;
          // break tie alphabetically if both lastSub dates are null
          if (dateA == null && dateB == null) {
            const nameA = a.name != null ? a.name : a.nameOrId();
            const nameB = b.name != null ? b.name : b.nameOrId();
            return nameA.localeCompare(nameB);
          }
          // null submission dates should go at the end
          if (dateA == null)
            return 1;
          if (dateB == null)
            return -1;
          return new Date(dateB) - new Date(dateA);
        },
        newest: (a, b) => {
          const dateA = a.createdAt;
          const dateB = b.createdAt;
          return new Date(dateB) - new Date(dateA);
        }
      };
      return sortFunctions[this.sortMode];
    },
    activeProjects() {
      if (this.projects == null) return [];
      const filteredProjects = this.projects.filter((p) => !(p.archived));
      return filteredProjects.sort(this.sortFunction);
    },
    archivedProjects() {
      if (this.projects == null) return [];
      const filteredProjects = this.projects.filter((p) => (p.archived));
      return filteredProjects.sort(this.sortFunction);
    }
  },
  methods: {
    afterCreate(project) {
      const message = this.$t('alert.create');
      this.$router.push(this.projectPath(project.id))
        .then(() => { this.alert.success(message); });
    }
  }
};
</script>

<style lang="scss">

#project-list-archived {
  .project-title {
    font-size: 24px;
    font-weight: 500;
  }
}

</style>

<i18n lang="json5">
{
  "en": {
    // This header is shown above a section of a page, specificially a list of names of archived projects.
    "archived": "Archived Projects",
    "action": {
      // This is the text of a button that is used to create a new Project.
      "create": "New"
    },
    "emptyTable": "There are no Projects for you to see.",
    "alert": {
      "create": "Your new Project has been successfully created."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "heading": [
      "Vítejte v Centralu.",
      "Pojďme udělat pár věcí."
    ],
    "gettingStarted": {
      "title": "Začínáme",
      "body": [
        {
          "full": "Pokud si nejste jisti, kde začít, je k dispozici příručka pro začínající a uživatelská dokumentace na {docsWebsite}.",
          "docsWebsite": "Webové stránky ODK Docs"
        },
        {
          "full": "Kromě toho můžete vždy získat pomoc od ostatních na {forum}, kde můžete prohledávat předchozí otázky, nebo položit vlastní.",
          "forum": "ODK komunitním fóru"
        }
      ]
    },
    "news": "Novinky",
    "rightNow": {
      "users": {
        "full": [
          "{webUsers} který může spravovat projekty prostřednictvím tohoto webu.",
          "{webUsers} kteří mohou spravovat projekty prostřednictvím tohoto webu.",
          "{webUsers} kteří mohou spravovat projekty prostřednictvím tohoto webu.",
          "{webUsers} kteří mohou spravovat projekty prostřednictvím tohoto webu."
        ],
        "webUsers": "Webový uživatel | Weboví uživatelé | Weboví uživatelé | Weboví uživatelé"
      },
      "projects": {
        "full": [
          "{projects} který může organizovat uživatele formulářů a aplikací pro nasazení zařízení.",
          "{projects} které mohou organizovat uživatele formulářů a aplikací pro nasazení zařízení.",
          "{projects} které mohou organizovat uživatele formulářů a aplikací pro nasazení zařízení.",
          "{projects} které mohou organizovat uživatele formulářů a aplikací pro nasazení zařízení."
        ],
        "projects": "Projekt | Projekty | Projektů | Projektů"
      }
    },
    "projectsTitle": "Projekty",
    "action": {
      "create": "Nový"
    },
    "header": {
      "forms": "Formuláře"
    },
    "emptyTable": "Nejsou žádné projekty, které byste mohli vidět.",
    "alert": {
      "create": "Váš nový projekt byl úspěšně vytvořen."
    }
  },
  "de": {
    "heading": [
      "Willkommen bei Central",
      "Lasst uns einige Dinge erledigen."
    ],
    "gettingStarted": {
      "title": "Erste Schritte",
      "body": [
        {
          "full": "Wenn Sie unsicher sind, wo sie anfangen sollen: Es gibt ein Erste-Schritte-Tutorial und die Benutzerdokumentation auf der {docsWebsite}.",
          "docsWebsite": "ODK Dokumentationswebseite"
        },
        {
          "full": "Außerdem können Sie im {forum} immer Hilfe von anderen erhalten. Dort können Sie auch nach Antworten auf ähnliche Fragen suchen und eigenen Fragen stellen.",
          "forum": "ODK-Community-Forum"
        }
      ]
    },
    "news": "Neuigkeiten",
    "rightNow": {
      "users": {
        "full": [
          "{webUsers}, der Projekte auf dieser Webseite verwalten kann.",
          "{webUsers}, die Projekte auf dieser Webseite verwalten können."
        ],
        "webUsers": "Web-Benutzer | Web-Benutzer"
      },
      "projects": {
        "full": [
          "{projects}, das Formulare und App-Benutzer von Mobilgeräten verwaltet.",
          "{projects}, die Formulare und App-Benutzer von Mobilgeräten verwalten."
        ],
        "projects": "Projekt | Projekte"
      }
    },
    "projectsTitle": "Projekte",
    "action": {
      "create": "Neu"
    },
    "header": {
      "forms": "Formulare"
    },
    "emptyTable": "Es gibt für Sie keine Formulare zum Anzeigen.",
    "alert": {
      "create": "Ihr neues Projekt wurde erfolgreich erstellt."
    }
  },
  "es": {
    "heading": [
      "Bienvenido a Central.",
      "Hagamos algunas cosas."
    ],
    "gettingStarted": {
      "title": "Introducción",
      "body": [
        {
          "full": "Si no está seguro de dónde empezar, consulte la guía de inicio y documentación del usuario dispuesta en {docsWebsite}.",
          "docsWebsite": "el sitio de documentación de ODK"
        },
        {
          "full": "Adicionalmente, siempre puede obtener ayuda de otros en el {forum}, donde puede buscar por preguntas previas o hacer una por su cuenta.",
          "forum": "foro de comunidad ODK"
        }
      ]
    },
    "news": "Novedades",
    "rightNow": {
      "users": {
        "full": [
          "{webUsers} que puede administrar proyectos a través de este sitio web.",
          "{webUsers} que pueden administrar proyectos a través de este sitios web."
        ],
        "webUsers": "Usuario web | Usuarios web"
      },
      "projects": {
        "full": [
          "{projects} que pueda organizar formularios y Usuarios móviles para la implementación de dispositivos.",
          "{projects} que pueda organizar formularios y Usuarios móviles para la implementación de dispositivos."
        ],
        "projects": "Proyecto | Proyectos"
      }
    },
    "projectsTitle": "Proyectos",
    "action": {
      "create": "Nuevo"
    },
    "header": {
      "forms": "Formularios"
    },
    "emptyTable": "No existen proyectos para mostrar.",
    "alert": {
      "create": "Su proyecto ha sido creado exitosamente"
    }
  },
  "fr": {
    "heading": [
      "Bienvenue dans Central.",
      "Faisons des progrès."
    ],
    "gettingStarted": {
      "title": "Commencer",
      "body": [
        {
          "full": "Si vous ne savez pas par où commencer, il y a un guide de démarrage et une documentation utilisateur sur le {docsWebsite}.",
          "docsWebsite": "site web de la documentaion d'ODK"
        },
        {
          "full": "De plus, vous pouvez toujours bénéficier de l'aide des autres utilisateurs sur le forum {forum}, en cherchant parmi les anciens sujets ou en en ouvrant un nouveau.",
          "forum": "forum de la communauté ODK"
        }
      ]
    },
    "news": "Nouvelles",
    "rightNow": {
      "users": {
        "full": [
          "{webUsers} pouvant administrer les projets à travers ce site.",
          "{webUsers} pouvant administrer les projets à travers ce site."
        ],
        "webUsers": "Utilisateur Web | Utilisateurs web"
      },
      "projects": {
        "full": [
          "{projects} qui regroupe des formulaires et des utilisateurs mobiles pour le déploiement d'appareils.",
          "{projects} qui regroupent des formulaires et des utilisateurs mobiles pour le déploiement d'appareils."
        ],
        "projects": "Projet | Projets"
      }
    },
    "projectsTitle": "Projets",
    "action": {
      "create": "Nouveau"
    },
    "header": {
      "forms": "Formulaires"
    },
    "emptyTable": "Il n'y a pas de projets à voir.",
    "alert": {
      "create": "Votre nouveau projet a été créé avec succès."
    }
  },
  "id": {
    "heading": [
      "Selamat datang di Central.",
      "Ayo selesaikan beberapa hal."
    ],
    "gettingStarted": {
      "title": "Mulai",
      "body": [
        {
          "full": "Apabila Anda tidak yakin harus memulai dari mana, {docsWebsite} menyediakan Panduan Awal dan Dokumentasi Pengguna yang dapat membantu Anda.",
          "docsWebsite": "Website ODK Docs"
        },
        {
          "full": "Selain itu, Anda selalu bisa mendapatkan pertolongan dari orang lain lewat {forum}, di mana Anda bisa mencari pertanyaan-pertanyaan yang sudah ditanyakan atau menanyakan pertanyaan Anda sendiri.",
          "forum": "Forum komunitas ODK"
        }
      ]
    },
    "news": "Berita",
    "rightNow": {
      "users": {
        "full": [
          "{webUsers} dapat mengelola Proyek lewat website ini."
        ],
        "webUsers": "Pengguna Web"
      },
      "projects": {
        "full": [
          "{projects} dapat mengorganisir Formulir dan Pengguna Aplikasi untuk penyebaran perangkat."
        ],
        "projects": "Proyek"
      }
    },
    "projectsTitle": "Proyek",
    "action": {
      "create": "Baru"
    },
    "header": {
      "forms": "Formulir"
    },
    "emptyTable": "Tidak ada Proyek untuk dilihat.",
    "alert": {
      "create": "Proyek baru Anda telah sukses dibuat."
    }
  },
  "it": {
    "heading": [
      "Benvenuto su Central",
      "Facciamo alcune cose."
    ],
    "gettingStarted": {
      "title": "Iniziamo",
      "body": [
        {
          "full": "Se non sai da dove cominciare, sono disponibili una guida introduttiva e la documentazione per l'utente sul {docsWebsite}.",
          "docsWebsite": "Sito web della documentazione ODK"
        },
        {
          "full": "Inoltre, puoi sempre ricevere aiuto dagli altri sul {forum}, dove puoi cercare domande precedenti o farne una tua.",
          "forum": "Forum della comunità ODK"
        }
      ]
    },
    "news": "Novità",
    "rightNow": {
      "users": {
        "full": [
          "{webUsers} che può amministrare i Progetti attraverso questo sito web.",
          "{webUsers} che possono amministrare i Progetti attraverso questo sito web."
        ],
        "webUsers": "Utente Web | Utenti web"
      },
      "projects": {
        "full": [
          "{projects} che può organizzare i formulari e gli utenti dell'app per la distribuzione sui dispositivi.",
          "{projects} che possono organizzare i formulari e gli utenti dell'app per la distribuzione sui dispositivi."
        ],
        "projects": "Progetto | Progetti"
      }
    },
    "projectsTitle": "Progetti",
    "action": {
      "create": "Nuovo"
    },
    "header": {
      "forms": "Formulari"
    },
    "emptyTable": "Non ci sono progetti da visualizzare.",
    "alert": {
      "create": "Il tuo nuovo progetto è stato creato con successo."
    }
  },
  "ja": {
    "heading": [
      "Centralへようこそ",
      "頑張って成し遂げましょう！"
    ],
    "gettingStarted": {
      "title": "はじめに",
      "body": [
        {
          "full": "何から手をつければいいのかわからない方のために、{docsWebsite}にはスタートアップガイドやユーザードキュメントが用意されています。",
          "docsWebsite": "ODK DocsのWebサイト"
        },
        {
          "full": "また、{forum}では、過去の質問を検索、または自分で質問をすることで、いつでもコミュニティメンバーの助けを得られます。",
          "forum": "ODKコミュニティーフォーラム"
        }
      ]
    },
    "news": "ニュース",
    "rightNow": {
      "users": {
        "full": [
          "{webUsers}は、プロジェクトの管理ができます。"
        ],
        "webUsers": "Webユーザー"
      },
      "projects": {
        "full": [
          "{projects}はデバイスに対してフォームとアプリユーザーの管理ができます。"
        ],
        "projects": "プロジェクト"
      }
    },
    "projectsTitle": "プロジェクト",
    "action": {
      "create": "新規作成"
    },
    "header": {
      "forms": "フォーム"
    },
    "emptyTable": "あなたが閲覧できるプロジェクトはありません。",
    "alert": {
      "create": "新規プロジェクトは正しく作成されました。"
    }
  },
  "sw": {
    "heading": [
      "Karibu Central.",
      "Hebu tufanye baadhi ya mambo."
    ],
    "gettingStarted": {
      "title": "Kuanza",
      "body": [
        {
          "full": "Iwapo huna uhakika pa kuanzia, kuna mwongozo wa kuanza na hati za mtumiaji zinazopatikana kwenye {docsWebsite}.",
          "docsWebsite": "Tovuti ya Hati za ODK"
        },
        {
          "full": "Kwa kuongeza, unaweza kupata usaidizi kutoka kwa wengine kwenye {forum} wakati wowote, ambapo unaweza kutafuta maswali ya awali au kuuliza moja yako mwenyewe.",
          "forum": "ODK jamii forum"
        }
      ]
    },
    "news": "Habari",
    "rightNow": {
      "users": {
        "full": [
          "{webUsers} ambaye anaweza kusimamia Miradi kupitia tovuti hii.",
          "{webUsers} ambao wanaweza kusimamia Miradi kupitia tovuti hii."
        ],
        "webUsers": "Mtumiaji wa Mtandao | Watumiaji wa Mtandao"
      },
      "projects": {
        "full": [
          "{projects} ambayo inaweza kupanga Fomu na Watumiaji wa Programu kwa ajili ya kusambaza kifaa.",
          "{projects} ambayo inaweza kupanga Fomu na Watumiaji wa Programu kwa ajili ya kusambaza kifaa."
        ],
        "projects": "Mradi | Miradi"
      }
    },
    "projectsTitle": "Miradi",
    "action": {
      "create": "Mpya"
    },
    "header": {
      "forms": "Fomu"
    },
    "emptyTable": "Hakuna Miradi kwako kuona.",
    "alert": {
      "create": "Mradi wako mpya umeundwa."
    }
  }
}
</i18n>
