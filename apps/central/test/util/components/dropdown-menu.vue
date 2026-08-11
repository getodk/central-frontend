<template>
  <div>
    <dropdown ref="dropdown" :close-on-menu-click="closeOnMenuClick">
      <template #toggle="{ toggle, attrs }">
        <button type="button" v-bind="attrs" @click="toggle">
          Menu
        </button>
      </template>
      <template #menu>
        <li><a id="action1" href="#">Action 1</a></li>
        <li><a id="action2" href="#">Action 2</a></li>
      </template>
    </dropdown>
    <button id="outside" type="button">Outside</button>
  </div>
</template>

<script>
import Dropdown from '../../../src/components/dropdown.vue';

export default {
  name: 'TestDropdownMenu',
  components: { Dropdown },
  props: {
    closeOnMenuClick: {
      type: Boolean,
      default: true
    }
  }
};
</script>
