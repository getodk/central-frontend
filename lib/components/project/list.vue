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
      <span>Welcome to Central.</span><span>Let’s get some things done.</span>
    </div>
    <div class="row">
      <div class="col-xs-6">
        <page-section>
          <span slot="heading">Getting Started</span>
          <template slot="body">
            <p>
              If you’re not sure where to begin, we have a getting started guide
              and user documentation available on the
              <doc-link to="central-intro/">Open Data Kit Docs website</doc-link>.
            </p>
            <p>
              In addition, you can always get help from others on the
              <a href="https://forum.opendatakit.org/" target="_blank">
                Open Data Kit community forum</a>,
              where you can search for previous answers or ask one of your own.
            </p>
          </template>
        </page-section>
        <page-section>
          <span slot="heading">News</span>
          <iframe id="project-list-news-iframe" slot="body"
            src="https://opendatakit.github.io/central/news.html">
          </iframe>
        </page-section>
      </div>
      <div class="col-xs-6">
        <page-section id="project-list-right-now">
          <span slot="heading">Right Now</span>
          <template slot="body">
            <loading :state="loadingRightNow"/>
            <template v-if="showsRightNow">
              <div v-if="currentUser.can('user.list')">
                <router-link to="/users"
                  class="project-list-right-now-icon-container">
                  <span class="icon-user-circle"></span>
                </router-link>
                <div class="project-list-right-now-count">
                  <router-link to="/users">
                    {{ users.length }} <span class="icon-angle-right"></span>
                  </router-link>
                </div>
                <div class="project-list-right-now-description">
                  <router-link to="/users">
                    <strong>{{ $pluralize('Web User', users.length) }}</strong>
                    who can administer Projects through this website.
                  </router-link>
                </div>
              </div>
              <div>
                <a href="#" class="project-list-right-now-icon-container"
                  @click.prevent="scrollToProjects">
                  <span class="icon-archive"></span>
                </a>
                <div class="project-list-right-now-count">
                  <a href="#" @click.prevent="scrollToProjects">
                    {{ projects.length }} <span class="icon-angle-right"></span>
                  </a>
                </div>
                <div class="project-list-right-now-description">
                  <a href="#" @click.prevent="scrollToProjects">
                    <strong>{{ $pluralize('Project', projects.length) }}</strong>
                    which can organize Forms and App Users for device
                    deployment.
                  </a>
                </div>
              </div>
            </template>
          </template>
        </page-section>
      </div>
    </div>
    <page-section id="project-list-projects">
      <template slot="heading">
        <span>Projects</span>
        <button v-if="currentUser.can('project.create')"
          id="project-list-new-button" type="button" class="btn btn-primary"
          @click="showModal('newProject')">
          <span class="icon-plus-circle"></span>New
        </button>
      </template>
      <template slot="body">
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
              @show-introduction="showIntroduction"/>
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
import ProjectIntroduction from './introduction.vue';
import ProjectNew from './new.vue';
import ProjectRow from './row.vue';
import modal from '../../mixins/modal';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'ProjectList',
  components: { ProjectIntroduction, ProjectNew, ProjectRow },
  mixins: [modal()],
  data() {
    return {
      newProject: {
        state: false
      },
      introduction: {
        migrated: false,
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
      this.$router.push(`/projects/${project.id}`, () => {
        this.$alert().success('Your new Project has been successfully created.');
      });
    },
    showIntroduction(migrated) {
      this.introduction.state = true;
      this.introduction.migrated = migrated;
    }
  }
};
</script>

<style lang="sass">
@import '../../../assets/scss/variables';

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

#project-list-right-now .page-section-body {
  a {
    color: inherit;
    text-decoration: none;
  }

  .project-list-right-now-icon-container {
    float: left;

    span {
      color: #555;
      font-size: 56px;
      margin-right: 0;
    }
  }

  .project-list-right-now-count, .project-list-right-now-description {
    margin-left: 75px;
  }

  .project-list-right-now-count {
    font-size: 30px;
    line-height: 1;
    margin-bottom: 3px;

    .icon-angle-right {
      color: $color-accent-primary;
      font-size: 20px;
      margin-right: 0;
      vertical-align: 2px;
    }
  }

  .project-list-right-now-description {
    color: #666;
    margin-bottom: 30px;

    strong {
      color: $color-text;
      font-weight: normal;
    }
  }
}

#project-list-projects {
  margin-top: 10px;
}

#project-list-table {
  table-layout: fixed;
}
</style>
