<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/opendatakit/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div v-show="dataExists" id="form-head">
    <div id="form-head-project-nav" class="row">
      <div class="col-xs-12">
        <div v-if="project !=null">
          <span>
            <router-link :to="projectPath()">
              {{ project.name }}{{ project.archived ? ' (archived)' : '' }}</router-link>
          </span>
          <router-link :to="projectPath()">Back to Project Overview</router-link>
        </div>
        <!-- The triangle below the project name -->
        <div></div>
      </div>
    </div>
    <div id="form-head-form-nav" class="row">
      <div class="col-xs-12">
        <div class="row">
          <!-- Using .col-xs-6 so that if the form name is long, it is not
          behind #form-head-draft-nav. -->
          <div class="col-xs-6">
            <div v-if="form != null" class="h1" :title="form.nameOrId()">
              {{ form.nameOrId() }}
            </div>
          </div>
        </div>
        <div class="row">
          <div class="col-xs-6">
            <ul id="form-head-form-tabs" class="nav nav-tabs">
              <!-- Using rendersFormTabs rather than canRoute(), because we want
              to render the tabs even if the form does not have a published
              version (in which case canRoute() will return `false`). -->
              <li v-if="rendersFormTabs" :class="formTabClass('')"
                :title="formTabTitle" role="presentation">
                <router-link :to="tabPath('')">Overview</router-link>
              </li>
              <!-- No v-if, because everyone with access to the project should
              be able to navigate to .../versions and .../submissions. -->
              <li :class="formTabClass('versions')" :title="formTabTitle"
                role="presentation">
                <router-link :to="tabPath('versions')">Versions</router-link>
              </li>
              <li :class="formTabClass('submissions')" :title="formTabTitle"
                role="presentation">
                <router-link :to="tabPath('submissions')">
                  Submissions
                </router-link>
              </li>
              <li v-if="rendersFormTabs" :class="formTabClass('settings')"
                :title="formTabTitle" role="presentation">
                <router-link :to="tabPath('settings')">Settings</router-link>
              </li>
            </ul>
          </div>
          <div v-if="rendersDraftNav" id="form-head-draft-nav"
            class="col-xs-6" :class="{ 'draft-exists': formDraft.isDefined() }">
            <button v-show="formDraft.isEmpty()"
              id="form-head-create-draft-button" type="primary"
              class="btn btn-primary" :disabled="awaitingResponse"
              @click="createDraft">
              <span class="icon-plus-circle"></span>Create a new Draft
              <spinner :state="awaitingResponse"/>
            </button>
            <ul v-show="formDraft.isDefined()" class="nav nav-tabs">
              <li v-if="canRoute(tabPath('draft/status'))"
                :class="tabClass('draft/status')" role="presentation">
                <router-link :to="tabPath('draft/status')">Status</router-link>
              </li>
              <li v-if="canRoute(tabPath('draft/attachments'))"
                :class="tabClass('draft/attachments')" role="presentation">
                <router-link :to="tabPath('draft/attachments')">
                  Media Files
                  <template v-if="attachments != null">
                    <span v-show="missingAttachmentCount !== 0" class="badge">
                      {{ missingAttachmentCount.toLocaleString() }}
                    </span>
                  </template>
                </router-link>
              </li>
              <li v-if="canRoute(tabPath('draft/testing'))"
                :class="tabClass('draft/testing')" role="presentation">
                <router-link :to="tabPath('draft/testing')">
                  Testing
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import Spinner from '../spinner.vue';
import request from '../../mixins/request';
import routes from '../../mixins/routes';
import tab from '../../mixins/tab';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

const requestKeys = ['project', 'form', 'formDraft', 'attachments'];

export default {
  name: 'FormHead',
  components: { Spinner },
  mixins: [request(), routes(), tab()],
  data() {
    return {
      awaitingResponse: false
    };
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(requestKeys),
    ...mapGetters(['missingAttachmentCount']),
    dataExists() {
      return this.$store.getters.dataExists(requestKeys);
    },
    tabPathPrefix() {
      return this.formPath();
    },
    rendersFormTabs() {
      return this.project != null && this.project.permits(['form.update']);
    },
    formTabTitle() {
      return this.form != null && this.form.publishedAt == null
        ? 'These functions will become available once you publish your Draft Form'
        : '';
    },
    rendersDraftNav() {
      return this.dataExists &&
        (this.formDraft.isDefined() || this.project.permits('form.update'));
    }
  },
  methods: {
    formTabClass(path) {
      const htmlClass = this.tabClass(path);
      if (this.form != null && this.form.publishedAt == null)
        htmlClass.disabled = true;
      return htmlClass;
    },
    createDraft() {
      this.post(apiPaths.formDraft(this.form.projectId, this.form.xmlFormId))
        .then(() => {
          this.$emit('fetch-draft');
          this.$router.push(this.formPath('draft/status'));
        })
        .catch(noop);
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

$draft-nav-padding: 23px;
$tab-li-margin-top: 5px;

body {
  // If as the user navigates between the tabs, the scrollbar is visible for
  // only some tabs, then the position of the tabs will shift as the user
  // navigates. To prevent that, we always show the scrollbar.
  overflow-y: scroll;
}

#form-head-project-nav, #form-head-form-nav {
  background-color: $color-subpanel-background;
}

#form-head-project-nav > .col-xs-12 > div:first-child {
  background-color: #ddd;
  font-size: 18px;
  margin: 0 -15px;
  padding: 15px;

  > span {
    font-weight: bold;
    margin-right: 10px;

    a {
      color: inherit;
      text-decoration: none;
    }
  }

  > a {
    font-size: 12px;
  }

  + div {
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 12px solid #ddd;
    height: 0;
    margin-bottom: -10px;
    width: 0;
  }
}

#form-head-form-nav {
  border-bottom: 1px solid $color-subpanel-border-strong;

  .h1 {
    margin-bottom: -10px;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .nav-tabs > li {
    margin-top: $tab-li-margin-top;
  }
}

#form-head-form-tabs {
  margin-top: $draft-nav-padding;

  > li.active > a {
    &, &:hover, &:focus {
      background-color: $color-subpanel-active;
    }
  }
}

#form-head-draft-nav {
  background-color: #ddd;
  padding-top: $draft-nav-padding;
  position: relative;

  &::before {
    color: #666;
    content: 'Draft';
    font-size: 12px;
    position: absolute;
    top: 7px;
  }
  &.draft-exists::before {
    left: /* .col-xs-6 padding-left */ 15px +
      /* .nav-tabs > li > a padding-left */ 8px;
  }

  #form-head-create-draft-button {
    /*
    6px =   1px (.nav-tabs > li > a has more top padding than .btn)
          + 1px (.nav-tabs > li > a has more bottom padding)
          + 1px (.nav-tabs > li > a has a bottom border)
          + 3px (because .nav-tabs > li > a has a higher font size?)
    */
    margin-bottom: 6px;
    margin-top: $tab-li-margin-top;
  }

  .nav-tabs > li.active > a {
    &, &:hover, &:focus {
      background-color: $color-page-background;
    }
  }
}
</style>
