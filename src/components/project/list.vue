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
            <template v-if="showsRightNow">
              <summary-item v-if="currentUser.can('user.list')"
                route-to="/users" icon="user-circle">
                <template #heading>
                  {{ $n(users.length, 'default') }}
                  <span class="icon-angle-right"></span>
                </template>
                <template #body>
                  <strong>{{ $tc('plural.webUser', users.length) }}</strong>
                  {{ $tc('rightNow.usersCaption', users.length) }}
                </template>
              </summary-item>
              <summary-item clickable icon="archive" @click="scrollToProjects">
                <template #heading>
                  {{ $n(projects.length, 'default') }}
                  <span class="icon-angle-right"></span>
                </template>
                <template #body>
                  <strong>{{ $tc('plural.project', projects.length) }}</strong>
                  {{ $tc('rightNow.projectsCaption', projects.length) }}
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
              :project-count="projects.length" :project="project"
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
    <project-introduction v-bind="introduction"
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
    loadingRightNow() {
      const keys = ['projects'];
      if (this.currentUser.can('user.list')) keys.push('users');
      return this.$store.getters.initiallyLoading(keys);
    },
    showsRightNow() {
      if (this.projects == null) return false;
      return !(this.currentUser.can('user.list') && this.users == null);
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
      this.$router.push(this.projectPath(project.id), () => {
        this.$alert().success(this.$t('alert.create'));
      });
    }
  }
};
</script>

<style lang="scss">
#project-list-heading {
  margin-bottom: 30px;
  margin-top: 25px;

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
      "Let’s get some things done."
    ],
    "gettingStarted": {
      "title": "Getting Started",
      "body": [
        {
          "full": "If you’re not sure where to begin, we have a getting started guide and user documentation available on the {docsWebsite}.",
          "docsWebsite": "ODK Docs website"
        },
        {
          "full": "In addition, you can always get help from others on the {forum}, where you can search for previous answers or ask one of your own.",
          "forum": "ODK community forum"
        }
      ]
    },
    "news": "News",
    "rightNow": {
      "usersCaption": "who can administer Projects through this website. | who can administer Projects through this website.",
      "projectsCaption": "which can organize Forms and App Users for device deployment. | which can organize Forms and App Users for device deployment."
    },
    "projectsTitle": "Projects",
    "action": {
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
