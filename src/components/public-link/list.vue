<!--
Copyright 2020 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div id="public-link-list">
    <div class="heading-with-button">
      <button type="button" class="btn btn-primary"
        @click="showModal('create')">
        <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
      </button>
      <p>
        <i18n :tag="false" path="heading[0].full">
          <template #state>
            <router-link :to="projectPath('form-access')">{{ $t('heading[0].state') }}</router-link>
          </template>
        </i18n>
        &nbsp;
        <i18n :tag="false" path="moreInfo.clickHere.full">
          <template #clickHere>
            <!-- TODO -->
            <doc-link>{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
          </template>
        </i18n>
      </p>
      <i18n tag="p" path="heading[1].full">
        <template #clickHere>
          <a href="#" @click.prevent="showModal('submissionOptions')">{{ $t('heading[1].clickHere') }}</a>
        </template>
      </i18n>
    </div>

    <public-link-table :highlighted="highlighted" @revoke="showRevoke"/>
    <loading :state="$store.getters.initiallyLoading(['publicLinks'])"/>
    <p v-if="publicLinks != null && publicLinks.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>

    <public-link-create v-bind="create" @hide="hideModal('create')"
      @success="afterCreate"/>
    <project-submission-options v-bind="submissionOptions"
      @hide="hideModal('submissionOptions')"/>
    <public-link-revoke v-bind="revoke" @hide="hideRevoke"
      @success="afterRevoke"/>
  </div>
</template>

<script>
import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import PublicLinkCreate from './create.vue';
import PublicLinkRevoke from './revoke.vue';
import PublicLinkTable from './table.vue';
import modal from '../../mixins/modal';
import routes from '../../mixins/routes';
import validateData from '../../mixins/validate-data';
import { apiPaths } from '../../util/request';
import { loadAsyncComponent } from '../../util/async-components';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'PublicLinkList',
  components: {
    DocLink,
    Loading,
    ProjectSubmissionOptions: loadAsyncComponent('ProjectSubmissionOptions'),
    PublicLinkCreate,
    PublicLinkRevoke,
    PublicLinkTable
  },
  mixins: [
    modal({ submissionOptions: 'ProjectSubmissionOptions' }),
    routes(),
    validateData()
  ],
  props: {
    projectId: {
      type: String,
      required: true
    },
    xmlFormId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      // The id of the highlighted public link
      highlighted: null,
      // Modals
      create: {
        state: false
      },
      submissionOptions: {
        state: false
      },
      revoke: {
        state: false,
        publicLink: null
      }
    };
  },
  // The component does not assume that this data will exist when the component
  // is created.
  computed: requestData(['publicLinks']),
  created() {
    this.fetchData(false);
  },
  methods: {
    fetchData(resend) {
      this.$store.dispatch('get', [{
        key: 'publicLinks',
        url: apiPaths.publicLinks(this.projectId, this.xmlFormId),
        resend
      }]).catch(noop);
      this.highlighted = null;
    },
    showRevoke(publicLink) {
      this.revoke.publicLink = publicLink;
      this.showModal('revoke');
    },
    hideRevoke() {
      this.hideModal('revoke');
      this.revoke.publicLink = null;
    },
    afterCreate(publicLink) {
      this.fetchData(true);
      this.hideModal('create');
      this.$alert().success(this.$t('alert.create'));
      this.highlighted = publicLink.id;
    },
    afterRevoke(publicLink) {
      this.fetchData(true);
      this.hideRevoke();
      this.$alert().success(this.$t('alert.revoke', publicLink));
    }
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "action": {
      "create": "Create Public Access Link",
    },
    "heading": [
      {
        "full": "Anyone with a Public Access Link can fill out this Form in a web browser. You can create multiple Links to track different distributions of the Form, to limit how long a specific group of people has access to the Form, and more. These links will only work if the Form is in the Open {state}.",
        "state": "state"
      },
      {
        "full": "Public Links are intended for self-reporting. If you are working with data collectors who need to submit the same Form multiple times, {clickHere} for other options.",
        "clickHere": "click here"
      }
    ],
    "emptyTable": "There are no Public Access Links for this Form.",
    "alert": {
      "create": "Success! Your Public Access Link has been created and is now live. Copy it below to distribute it.",
      "revoke": "The Public Access Link “{displayName}” was revoked successfully. No further Submissions will be accepted using this Link."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{}
</i18n>
