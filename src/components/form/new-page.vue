<template>
  <div id="form-new">
    <page-section>
      <template #heading>
        <span>{{ $t('title') }}</span>
      </template>
      <template #body>
        <form-upload @success="afterCreate" @cancel="afterCancel"/>
      </template>
    </page-section>
  </div>
</template>

<script setup>
import { inject } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

import PageSection from '../page/section.vue';
import FormUpload from './upload.vue';

import useRoutes from '../../composables/routes';

defineOptions({
  name: 'FormNewPage'
});

const router = useRouter();
const { t } = useI18n();
const { formPath, projectPath } = useRoutes();
const alert = inject('alert');

const afterCreate = async (form) => {
  const message = t('alert.create', {
    name: form.name != null ? form.name : form.xmlFormId
  });
  await router.push(formPath(form.projectId, form.xmlFormId, 'draft'));
  alert.success(message);
};

const afterCancel = async () => {
  await router.push(projectPath());
};

</script>

<style lang="scss">
#form-new {
  p {
    max-width: unset;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // @transifexKey component.FormNew.title.create
    // This is the title at the top of a page.
    "title": "Create Form",
    "alert": {
      // @transifexKey component.FormList.alert.create
      "create": "“{name}” has been created as a Form Draft."
    }
  }
}
</i18n>
