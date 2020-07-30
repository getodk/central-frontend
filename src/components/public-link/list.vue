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
  <div>
    <div class="heading-with-button">
      <button type="button" class="btn btn-primary"
        @click="showModal('create')">
        <span class="icon-plus-circle"></span>{{ $t('action.create') }}&hellip;
      </button>
      <p>TODO</p>
    </div>

    <public-link-table :highlighted="highlighted" @revoke="showRevoke"/>
    <loading :state="$store.getters.initiallyLoading(['publicLinks'])"/>
    <p v-if="publicLinks != null && publicLinks.length === 0"
      class="empty-table-message">
      {{ $t('emptyTable') }}
    </p>

    <public-link-create v-bind="create" @hide="hideModal('create')"
      @success="afterCreate"/>
    <public-link-revoke v-bind="revoke" @hide="hideRevoke"
      @success="afterRevoke"/>
  </div>
</template>

<script>
import Loading from '../loading.vue';
import PublicLinkCreate from './create.vue';
import PublicLinkRevoke from './revoke.vue';
import PublicLinkTable from './table.vue';
import modal from '../../mixins/modal';
import validateData from '../../mixins/validate-data';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import { requestData } from '../../store/modules/request';

export default {
  name: 'PublicLinkList',
  components: { Loading, PublicLinkCreate, PublicLinkRevoke, PublicLinkTable },
  mixins: [modal(), validateData()],
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
    "emptyTable": "There are no Public Access Links for this Form.",
    "alert": {
      "create": "Success! Your Public Access Link has been created and is now live. Copy it below to distribute it.",
      "revoke": "The Access Link “{displayName}” was revoked successfully. No further Submissions will be accepted using this Link."
    }
  }
}
</i18n>
