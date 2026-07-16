<template>
  <div>
    <Dropdown>
      <template #toggle="{ toggle, attrs }">
        <button id="toggle" type="button" class="dropdown-toggle" v-bind="attrs" @click="toggle">
          Menu
        </button>
      </template>
      <template #menu>
        <li><a id="action1" href="#">Action 1</a></li>
        <li><a id="action2" href="#">Action 2</a></li>
      </template>
    </Dropdown>
    <button id="outside" type="button">Outside</button>
  </div>
</template>

<script>
import Dropdown from '../../../src/components/dropdown.vue';

export default {
  name: 'TestDropdownMenu',
  components: { Dropdown }
};
</script>
