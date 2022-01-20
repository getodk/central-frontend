<template>
  <div></div>
</template>

<script>
import { mixinRequests } from '../../../src/reusables/requests';

export default {
  name: 'TestUtilRequest',
  mixins: [mixinRequests],
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
