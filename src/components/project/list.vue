<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <div id="project-list-heading">
      <span>Welcome to Central.</span>
      <span>Let&rsquo;s get some things done.</span>
    </div>
    <div class="row">
      <div class="col-xs-6">
        <page-section>
          <template #heading>
            <span>Getting Started</span>
          </template>
          <template #body>
            <p>
              If you&rsquo;re not sure where to begin, we have a getting started
              guide and user documentation available on the
              <doc-link to="central-intro/">ODK Docs website</doc-link>.
            </p>
            <p>
              In addition, you can always get help from others on the
              <a href="https://forum.opendatakit.org/" target="_blank">
                ODK community forum</a>,
              where you can search for previous answers or ask one of your own.
            </p>
          </template>
        </page-section>
        <page-section>
          <template #heading>
            <span>News</span>
          </template>
          <template #body>
            <iframe id="project-list-news-iframe"
              src="https://opendatakit.github.io/central/news.html">
            </iframe>
          </template>
        </page-section>
      </div>
      <div class="col-xs-6">
        <page-section id="project-list-right-now">
          <template #heading>
            <span>Right Now</span>
          </template>
          <template #body>
            <loading :state="loadingRightNow"/>
            <template v-if="showsRightNow">
              <summary-item v-if="currentUser.can('user.list')"
                route-to="/users" icon="user-circle">
                <template #heading>
                  {{ users.length.toLocaleString() }}
                  <span class="icon-angle-right"></span>
                </template>
                <template #body>
                  <strong>{{ $pluralize('Web User', users.length) }}</strong>
                  who can administer Projects through this website.
                </template>
              </summary-item>
              <summary-item clickable icon="archive" @click="scrollToProjects">
                <template #heading>
                  {{ projects.length.toLocaleString() }}
                  <span class="icon-angle-right"></span>
                </template>
                <template #body>
                  <strong>{{ $pluralize('Project', projects.length) }}</strong>
                  which can organize Forms and App Users for device deployment.
                </template>
              </summary-item>
            </template>
          </template>
        </page-section>
      </div>
    </div>
    <page-section id="project-list-projects">
      <template #heading>
        <span>Projects</span>
        <button v-if="currentUser.can('project.create')"
          id="project-list-new-button" type="button" class="btn btn-primary"
          @click="showModal('newProject')">
          <span class="icon-plus-circle"></span>New&hellip;
        </button>
      </template>
      <template #body>
        <table id="project-list-table" class="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Forms</th>
              <th>Latest Submission</th>
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
          There are no Projects for you to see.
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
        this.$alert().success('Your new Project has been successfully created.');
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
