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
  <div>
    <div id="project-list-heading">
      <span>{{ $t('heading[0]') }}</span><span>{{ $t('heading[1]') }}</span>
    </div>
    <div class="row">
      <div class="col-xs-6">
        <page-section>
          <template #heading>
            <span>{{ $t('gettingStarted.title') }}</span>
          </template>
          <template #body>
            <i18n tag="p" path="gettingStarted.body[0].full">
              <template #docsWebsite>
                <doc-link to="central-intro/">{{ $t('gettingStarted.body[0].docsWebsite') }}</doc-link>
              </template>
            </i18n>
            <i18n tag="p" path="gettingStarted.body[1].full">
              <template #forum>
                <a href="https://forum.getodk.org/" target="_blank">{{ $t('gettingStarted.body[1].forum') }}</a>
              </template>
            </i18n>
          </template>
        </page-section>
        <page-section>
          <template #heading>
            <span>{{ $t('news') }}</span>
          </template>
          <template #body>
            <iframe id="project-list-news-iframe"
              src="https://getodk.github.io/central/news.html">
            </iframe>
          </template>
        </page-section>
      </div>
      <div class="col-xs-6">
        <page-section id="project-list-right-now">
          <template #heading>
            <span>{{ $t('common.rightNow') }}</span>
          </template>
          <template #body>
            <loading :state="loadingRightNow"/>
            <template v-if="dataExistsForRightNow">
              <summary-item v-if="currentUser.can('user.list')"
                route-to="/users" icon="user-circle">
                <template #heading>
                  {{ $n(users.length, 'default') }}
                  <span class="icon-angle-right"></span>
                </template>
                <template #body>
                  <i18n tag="p"
                    :path="$tcPath('rightNow.users.full', users.length)">
                    <template #webUsers>
                      <strong>{{ $tc('rightNow.users.webUsers', users.length) }}</strong>
                    </template>
                  </i18n>
                </template>
              </summary-item>
              <summary-item clickable icon="archive" @click="scrollToProjects">
                <template #heading>
                  {{ $n(projects.length, 'default') }}
                  <span class="icon-angle-right"></span>
                </template>
                <template #body>
                  <i18n tag="p"
                    :path="$tcPath('rightNow.projects.full', projects.length)">
                    <template #projects>
                      <strong>{{ $tc('rightNow.projects.projects', projects.length) }}</strong>
                    </template>
                  </i18n>
                </template>
              </summary-item>
            </template>
          </template>
        </page-section>
      </div>
    </div>
    <page-section id="project-list-projects">
      <template #heading>
        <span>{{ $t('projectsTitle') }}</span>
        <button v-if="currentUser.can('project.create')"
          id="project-list-new-button" type="button" class="btn btn-primary"
          @click="showModal('newProject')">
          <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
        </button>
      </template>
      <template #body>
        <table id="project-list-table" class="table">
          <thead>
            <tr>
              <th>{{ $t('header.name') }}</th>
              <th>{{ $t('header.forms') }}</th>
              <th>{{ $t('header.lastSubmission') }}</th>
            </tr>
          </thead>
          <tbody v-if="projects != null">
            <project-row v-for="project of projects" :key="project.id"
              :project="project" :introduction="rendersIntroduction"
              @show-introduction="showModal('introduction')"/>
          </tbody>
        </table>
        <loading :state="$store.getters.initiallyLoading(['projects'])"/>
        <p v-if="projects != null && projects.length === 0"
          class="empty-table-message">
          {{ $t('emptyTable') }}
        </p>
      </template>
    </page-section>

    <project-new v-bind="newProject" @hide="hideModal('newProject')"
      @success="afterCreate"/>
    <project-introduction v-if="rendersIntroduction" v-bind="introduction"
      @hide="hideModal('introduction')"/>
  </div>
</template>

<script>
import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import ProjectIntroduction from './introduction.vue';
import ProjectNew from './new.vue';
import ProjectRow from './row.vue';
import SummaryItem from '../summary-item.vue';
import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectList',
  components: {
    DocLink,
    Loading,
    PageSection,
    ProjectIntroduction,
    ProjectNew,
    ProjectRow,
    SummaryItem
  },
  mixins: [modal(), routes()],
  data() {
    return {
      newProject: {
        state: false
      },
      introduction: {
        state: false
      }
    };
  },
  computed: {
    ...requestData(['currentUser', 'projects', 'users']),
    // We should probably move the "Right Now" section into its own component.
    rightNowKeys() {
      const keys = ['projects'];
      if (this.currentUser.can('user.list')) keys.push('users');
      return keys;
    },
    loadingRightNow() {
      return this.$store.getters.initiallyLoading(this.rightNowKeys);
    },
    dataExistsForRightNow() {
      return this.$store.getters.dataExists(this.rightNowKeys);
    },
    rendersIntroduction() {
      if (this.projects == null || this.projects.length !== 1) return false;
      const project = this.projects[0];
      return project.name === 'Default Project' && project.forms === 0;
    }
  },
  created() {
    this.$store.dispatch('get', [{
      key: 'projects',
      url: '/projects',
      extended: true
    }]).catch(noop);
    if (this.currentUser.can('user.list')) {
      this.$store.dispatch('get', [{ key: 'users', url: '/users' }])
        .catch(noop);
    }
  },
  methods: {
    scrollToProjects() {
      const scrollTop = Math.round($('#project-list-projects').offset().top);
      $('html, body').animate({ scrollTop });
    },
    afterCreate(project) {
      this.$router.push(this.projectPath(project.id))
        .then(() => {
          this.$alert().success(this.$t('alert.create'));
        });
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#project-list-heading {
  background: $color-subpanel-background;
  border-bottom: 1px solid $color-subpanel-border;
  letter-spacing: -0.03em;
  margin: 0 -15px 15px;
  padding: 20px 15px;

  span {
    &:first-child {
      font-size: 30px;
      font-weight: bold;
    }

    &:last-child {
      color: #666;
      font-size: 24px;
      margin-left: 10px;
    }
  }
}

#project-list-news-iframe {
  border-width: 0;
  height: 80px;
  width: 100%;
}

#project-list-projects {
  margin-top: 10px;
}

#project-list-table {
  table-layout: fixed;
}
</style>

<i18n lang="json5">
{
  "en": {
    "heading": [
      "Welcome to Central.",
      // This is a tagline displayed next to "Welcome to Central". The text adds visual balance to the page and does not need to be translated literally to your language. The text should be action-oriented, collaborative, and a little bit fun.
      "Let’s get some things done."
    ],
    "gettingStarted": {
      // This is a title shown above a section of the page.
      "title": "Getting Started",
      "body": [
        {
          "full": "If you’re not sure where to begin, there is a getting started guide and user documentation available on the {docsWebsite}.",
          "docsWebsite": "ODK Docs website"
        },
        {
          "full": "In addition, you can always get help from others on the {forum}, where you can search previous questions or ask one of your own.",
          "forum": "ODK community forum"
        }
      ]
    },
    // This is a title shown above a section of the page.
    "news": "News",
    "rightNow": {
      "users": {
        // The count of Web Users is shown separately above this text.
        "full": [
          "{webUsers} who can administer Projects through this website.",
          "{webUsers} who can administer Projects through this website."
        ],
        "webUsers": "Web User | Web Users"
      },
      "projects": {
        // The count of Projects is shown separately above this text.
        "full": [
          "{projects} which can organize Forms and App Users for device deployment.",
          "{projects} which can organize Forms and App Users for device deployment."
        ],
        "projects": "Project | Projects"
      }
    },
    // This is a title shown above a section of the page.
    "projectsTitle": "Projects",
    "action": {
      // This is the text of a button that is used to create a new Project.
      "create": "New"
    },
    "header": {
      "forms": "Forms"
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
  }
}
</i18n>
