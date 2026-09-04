<template>
  <div class="actor-properties-new">
    <template v-if="showForm">
      <div class="actor-properties-header">
        <strong>{{ $t('addProperty') }}</strong>
        <p>{{ $t('addPropertyHint') }}</p>
      </div>
      <form class="actor-properties-new-form" @submit.prevent="submit">
        <property-input ref="input" v-model="name" type="actor"
          :properties="propertyCreator.allProperties"/>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">
            {{ $t('action.add') }}
          </button>
          <button type="button" class="btn btn-link" @click="reset">
            {{ $t('action.cancel') }}
          </button>
        </div>
      </form>
    </template>
    <a v-else href="#" class="add-property-link"
      @click.prevent="show()">
      <span class="icon-plus-circle"></span>{{ $t('addProperty') }}
    </a>
  </div>
</template>

<script setup>
import { nextTick, ref } from 'vue';

import PropertyInput from '../property-input.vue';

import { useActorPropertyCreator } from '../../composables/actor-property-creator';

defineOptions({
  name: 'ActorPropertiesNew'
});

const propertyCreator = useActorPropertyCreator();

const name = ref('');
const showForm = ref(false);

const input = ref(null);
const show = () => {
  showForm.value = true;
  nextTick(() => input.value.focus());
};

const reset = () => {
  name.value = '';
  showForm.value = false;
};

const submit = () => {
  propertyCreator.add(name.value);
  reset();
};
</script>

<style lang="scss">
.actor-properties-new {
  padding-top: 8px;
}

.actor-properties-new-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  column-gap: 8px;

  .form-group {
    flex: 1;
    margin-bottom: 0;
  }

  .property-input-error {
    order: 3;
    width: 100%;
    margin-bottom: 0;
  }

  .form-actions {
    white-space: nowrap;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "addProperty": "Add Property",
    "addPropertyHint": "Enter a unique property name"
  }
}
</i18n>
