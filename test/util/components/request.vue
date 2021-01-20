<template>
  <div></div>
</template>

<script>
import request from '../../../src/mixins/request';

export default {
  name: 'TestUtilRequest',
  mixins: [request()],
  data() {
    return {
      awaitingResponse: false
    };
  }
};
</script>

<i18n lang="json5">
{
  "en": {
    "problem": {
      "404_1": "Message for locale"
    }
  }
}
</i18n>
