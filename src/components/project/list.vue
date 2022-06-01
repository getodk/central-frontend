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
            :project="project" :sort-func="sortFunction"
            :max-forms="maxForms"/>
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
import { sum } from 'ramda';

import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import ProjectNew from './new.vue';
import ProjectHomeBlock from './home-block.vue';
import ProjectSort from './sort.vue';

import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import { requestData } from '../../store/modules/request';
import sortFunctions from '../../util/sort';

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
    "action": {
      "create": "Nový"
    },
    "emptyTable": "Nejsou žádné projekty, které byste mohli vidět.",
    "alert": {
      "create": "Váš nový projekt byl úspěšně vytvořen."
    }
  },
  "de": {
    "action": {
      "create": "Neu"
    },
    "emptyTable": "Es gibt für Sie keine Formulare zum Anzeigen.",
    "alert": {
      "create": "Ihr neues Projekt wurde erfolgreich erstellt."
    }
  },
  "es": {
    "action": {
      "create": "Nuevo"
    },
    "emptyTable": "No existen proyectos para mostrar.",
    "alert": {
      "create": "Su proyecto ha sido creado exitosamente"
    }
  },
  "fr": {
    "action": {
      "create": "Nouveau"
    },
    "emptyTable": "Il n'y a pas de projets à voir.",
    "alert": {
      "create": "Votre nouveau projet a été créé avec succès."
    }
  },
  "id": {
    "action": {
      "create": "Baru"
    },
    "emptyTable": "Tidak ada Proyek untuk dilihat.",
    "alert": {
      "create": "Proyek baru Anda telah sukses dibuat."
    }
  },
  "it": {
    "action": {
      "create": "Nuovo"
    },
    "emptyTable": "Non ci sono progetti da visualizzare.",
    "alert": {
      "create": "Il tuo nuovo progetto è stato creato con successo."
    }
  },
  "ja": {
    "action": {
      "create": "新規作成"
    },
    "emptyTable": "あなたが閲覧できるプロジェクトはありません。",
    "alert": {
      "create": "新規プロジェクトは正しく作成されました。"
    }
  },
  "sw": {
    "action": {
      "create": "Mpya"
    },
    "emptyTable": "Hakuna Miradi kwako kuona.",
    "alert": {
      "create": "Mradi wako mpya umeundwa."
    }
  }
}
</i18n>
