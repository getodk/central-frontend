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
  <div v-if="count > 0">
    <div id="trash-list-header">
      <span id="trash-list-title"><span class="icon-trash"></span>{{ $t('title') }}</span>
      <span id="trash-list-count">({{ count }})</span>
      <span id="trash-list-note">{{ $t('message') }}</span>
    </div>
    <table v-if="project != null" class="table">
      <tbody v-if="deletedForms != null">
        <form-trash-row v-for="form of sortedDeletedForms" :key="form.hash" :form="form"
          @start-restore="showRestore"/>
      </tbody>
    </table>
    <loading :state="$store.getters.initiallyLoading(['deletedForms'])"/>
    <form-restore :state="restoreForm.state" :form="restoreForm.form" @hide="hideRestore" @success="afterRestore"/>
  </div>
</template>

<script>
import { ascend } from 'ramda';
import FormTrashRow from './trash-row.vue';
import FormRestore from './restore.vue';
import Loading from '../loading.vue';
import { requestData } from '../../store/modules/request';
import { apiPaths } from '../../util/request';
import { noop } from '../../util/util';
import modal from '../../mixins/modal';

export default {
  name: 'FormTrashList',
  components: { FormTrashRow, FormRestore, Loading },
  mixins: [modal()],
  data() {
    return {
      restoreForm: {
        state: false,
        form: null
      }
    };
  },
  computed: {
    // The component does not assume that this data will exist when the
    // component is created.
    ...requestData(['project', 'deletedForms']),
    count() {
      return (this.deletedForms != null ? this.deletedForms.length : 0);
    },
    sortedDeletedForms() {
      const formCopy = this.deletedForms;
      return (formCopy.sort(ascend(entry => entry.deletedAt)));
    }
  },
  created() {
    this.fetchDeletedForms(false);
  },
  methods: {
    fetchDeletedForms(resend) {
      this.$store.dispatch('get', [{
        key: 'deletedForms',
        url: apiPaths.deletedForms(this.project.id),
        extended: true,
        resend
      }]).catch(noop);
    },
    showRestore(form) {
      this.restoreForm.form = form;
      this.showModal('restoreForm');
    },
    hideRestore() {
      this.hideModal('restoreForm');
    },
    afterRestore() {
      this.hideRestore();
      this.$alert().success(this.$t('alert.restore', { name: this.restoreForm.form.name }));
      this.restoreForm.form = null;

      // refresh trashed forms list
      this.fetchDeletedForms(true);

      // tell parent component (project overview) to refresh regular forms list
      // (by emitting event to that component's parent)
      this.$emit('restore');
    }
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/mixins';

#trash-list-header {
  display: flex;
  align-items: baseline;

  .icon-trash {
    padding-right: 8px;
  }

  #trash-list-title {
    font-size: 26px;
    font-weight: 700;
    color: $color-danger;
  }

  #trash-list-count {
    font-size: 20px;
    color: #888;
    padding-left: 4px;
  }

  #trash-list-note {
    margin-left: auto;
    color: #888
  }
}

</style>

<i18n lang="json5">
{
  "en": {
    "title": "Trash",
    "alert": {
      "restore": "The Form “{name}” has been undeleted."
    },
    "message": "Forms and Form-related data are deleted after 30 days in the Trash"
  }
}
</i18n>
