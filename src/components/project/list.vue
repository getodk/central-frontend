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
        <div v-if="projects.dataExists">
          <project-home-block v-for="project of activeProjects" :key="project.id"
            :project="project" :sort-func="sortFunction"
            :max-forms="maxForms"/>
        </div>
        <loading :state="projects.initiallyLoading"/>
        <p v-if="projects.dataExists && activeProjects.length === 0"
          class="empty-table-message">
          <template v-if="currentUser.can('project.create')">
            {{ $t('emptyTable.canCreate') }}<sentence-separator/>
            <i18n-t keypath="moreInfo.clickHere.full">
              <template #clickHere>
                <doc-link to="central-projects/">{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
              </template>
            </i18n-t>
          </template>
          <template v-else>{{ $t('emptyTable.cannotCreate') }}</template>
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
import { sum } from 'ramda';

import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import ProjectNew from './new.vue';
import ProjectHomeBlock from './home-block.vue';
import ProjectSort from './sort.vue';
import SentenceSeparator from '../sentence-separator.vue';

import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import sortFunctions from '../../util/sort';
import { useRequestData } from '../../request-data';

export default {
  name: 'ProjectList',
  components: {
    DocLink,
    Loading,
    PageSection,
    ProjectNew,
    ProjectHomeBlock,
    ProjectSort,
    SentenceSeparator
  },
  mixins: [modal(), routes()],
  inject: ['alert'],
  setup() {
    const { currentUser, projects } = useRequestData();
    return { currentUser, projects };
  },
  data() {
    return {
      newProject: {
        state: false
      },
      sortMode: 'latest'
    };
  },
  computed: {
    sortFunction() {
      return sortFunctions[this.sortMode];
    },
    activeProjects() {
      if (!this.projects.dataExists) return [];
      const filteredProjects = this.projects.filter((p) => !(p.archived));
      return filteredProjects.sort(this.sortFunction);
    },
    archivedProjects() {
      if (!this.projects.dataExists) return [];
      const filteredProjects = this.projects.filter((p) => (p.archived));
      return filteredProjects.sort(this.sortFunction);
    },
    maxForms() {
      let limit = 3;

      // if there are many projects, don't bother with computing form limit
      if (this.projects.length >= 15)
        return limit;

      const formCounts = this.projects.map((project) =>
        project.formList.filter((f) => f.state !== 'closed').length);
      const totalForms = sum(formCounts);

      // eslint-disable-next-line no-constant-condition
      while (true) {
        limit += 1;
        const shownForms = formCounts.reduce(
          // eslint-disable-next-line no-loop-func
          (acc, count) => acc + Math.min(count, limit),
          0
        );

        // If we have exceeded the number of forms
        // to show, back up to previous limit.
        if (shownForms > 15)
          return limit - 1;

        // If we are showing all the forms that are
        // possible to show, return current limit.
        if (shownForms === totalForms)
          return limit;

        // If we are showing less than that,
        // go through loop again (try increasing limit).
      }
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
    "emptyTable": {
      "canCreate": "To get started, create a Project. Projects help you organize your data by grouping related Forms and Users.",
      "cannotCreate": "There are no Projects to show. If you expect to see Projects here, talk to the person who gave you this account. They may need to assign a Project Role for Projects you’re supposed to see."
    },
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
    "archived": "Archivované projekty",
    "action": {
      "create": "Nový"
    },
    "emptyTable": {
      "canCreate": "Chcete-li začít, vytvořte projekt. Projekty vám pomohou uspořádat data seskupením souvisejících formulářů a uživatelů.",
      "cannotCreate": "Neexistují žádné projekty, které by bylo možné zobrazit. Pokud očekáváte, že se zde Projekty zobrazí, obraťte se na osobu, která vám tento účet poskytla. Možná bude potřebovat přiřadit Projektovou roli pro Projekty, které byste měli vidět."
    },
    "alert": {
      "create": "Váš nový projekt byl úspěšně vytvořen."
    }
  },
  "de": {
    "archived": "Archivierte Projekte",
    "action": {
      "create": "Neu"
    },
    "emptyTable": {
      "canCreate": "Erstellen Sie zunächst ein Projekt. Projekte helfen Ihnen, Ihre Daten zu organisieren, indem Sie verwandte Formulare und Benutzer gruppieren.",
      "cannotCreate": "Es gibt keine anzuzeigenden Projekte. Wenn Sie erwarten, dass Projekte hier angezeigt werden, sprechen Sie mit der Person, die Ihnen dieses Konto gegeben hat. Sie müssen möglicherweise eine Projektrolle für Projekte zuweisen, die Sie sehen sollen."
    },
    "alert": {
      "create": "Ihr neues Projekt wurde erfolgreich erstellt."
    }
  },
  "es": {
    "archived": "Proyectos archivados",
    "action": {
      "create": "Nuevo"
    },
    "emptyTable": {
      "canCreate": "Para comenzar, cree un Proyecto. Los proyectos lo ayudan a organizar sus datos agrupando formularios y usuarios relacionados.",
      "cannotCreate": "No hay Proyectos para mostrar. Si espera ver Proyectos aquí, hable con la persona que le dio esta cuenta. Es posible que deban asignar un rol de proyecto para los proyectos que se supone que debe ver."
    },
    "alert": {
      "create": "Su proyecto ha sido creado exitosamente"
    }
  },
  "fr": {
    "archived": "Projets archivés",
    "action": {
      "create": "Nouveau"
    },
    "emptyTable": {
      "canCreate": "Pour démarrer, créez un Projet. Les projets vous aident à organiser vos données en regroupant des formulaires et des utilisateurs qui sont liés",
      "cannotCreate": "Il n'y a pas de Projet à afficher. Si vous vous attendiez à en voir ici, contactez la personne qui vous a créé ce compte. Il pourrait devoir vous attribuer un rôle de projet pour les projets que vous êtes censé voir."
    },
    "alert": {
      "create": "Votre nouveau projet a été créé avec succès."
    }
  },
  "id": {
    "action": {
      "create": "Baru"
    },
    "alert": {
      "create": "Proyek baru Anda telah sukses dibuat."
    }
  },
  "it": {
    "archived": "Progetti archiviati",
    "action": {
      "create": "Nuovo"
    },
    "emptyTable": {
      "canCreate": "Per iniziare, crea un progetto. I progetti ti aiutano a organizzare i tuoi dati raggruppando i formulari e gli utenti correlati.",
      "cannotCreate": "Non ci sono progetti da mostrare. Se prevedi di vedere Progetti qui, parla con la persona che ti ha fornito questo account. Potrebbe essere necessario assegnare un ruolo di progetto per i progetti che dovresti vedere."
    },
    "alert": {
      "create": "Il tuo nuovo progetto è stato creato con successo."
    }
  },
  "ja": {
    "action": {
      "create": "新規作成"
    },
    "alert": {
      "create": "新規プロジェクトは正しく作成されました。"
    }
  },
  "sw": {
    "action": {
      "create": "Mpya"
    },
    "alert": {
      "create": "Mradi wako mpya umeundwa."
    }
  }
}
</i18n>
