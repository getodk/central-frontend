<template>
  <div v-show="message != null" id="odata-loading-message">
    <div id="odata-loading-spinner-container">
      <spinner :state="message != null"/>
    </div>
    <div id="odata-loading-message-text">{{ message }}</div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import Spinner from './spinner.vue';
import { useI18nUtils } from '../util/i18n';

const { t } = useI18n();
const { tn } = useI18nUtils();

defineOptions({
  name: 'OdataLoadingMessage'
});

const props = defineProps({
  odata: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  refreshing: {
    type: Boolean,
    required: true
  },
  filter: {
    type: Boolean,
    default: false
  },
  totalCount: {
    type: Number,
    required: true
  },
  top: {
    type: Number,
    required: true
  }
});



const message = computed(() => {
  if (!props.odata.awaitingResponse || props.refreshing) return null;

  if (!props.odata.dataExists) {
    if (props.filter)
      return t(`${props.type}.filtered.withoutCount`);

    if (props.totalCount === 0)
      return t(`${props.type}.withoutCount`);

    if (props.totalCount <= props.top)
      return tn(`${props.type}.all`, props.totalCount);

    return tn(`${props.type}.first`, props.totalCount, {
      top: props.top
    });
  }

  const pathPrefix = props.filter
    ? `${props.type}.filtered`
    : `${props.type}`;
  const remaining = props.odata.originalCount - props.odata.value.length;
  if (remaining > props.top) {
    return tn(`${pathPrefix}.middle`, remaining, {
      top: props.top
    });
  }
  return remaining > 1
    ? tn(`${pathPrefix}.last.multiple`, remaining)
    : t(`${pathPrefix}.last.one`);
});

</script>

<i18n lang="json5">
  {
    "en": {
      // @transifexKey component.SubmissionList.loading
      "submission": {
        // This text is shown when the number of Submissions loading is unknown.
        "withoutCount": "Loading Submissions…",
        "all": "Loading {count} Submission… | Loading {count} Submissions…",
        // {top} is a number that is either 250 or 1000. {count} may be any number
        // that is at least 250. The string will be pluralized based on {count}.
        "first": "Loading the first {top} of {count} Submission… | Loading the first {top} of {count} Submissions…",
        // {top} is a number that is either 250 or 1000. {count} may be any number
        // that is at least 250. The string will be pluralized based on {count}.
        "middle": "Loading {top} more of {count} remaining Submission… | Loading {top} more of {count} remaining Submissions…",
        "last": {
          "multiple": "Loading the last {count} Submission… | Loading the last {count} Submissions…",
          "one": "Loading the last Submission…"
        },
        "filtered": {
          // This text is shown when the number of Submissions loading is unknown.
          "withoutCount": "Loading matching Submissions…",
          // {top} is a number that is either 250 or 1000. {count} may be any
          // number that is at least 250. The string will be pluralized based on
          // {count}.
          "middle": "Loading {top} more of {count} remaining matching Submission… | Loading {top} more of {count} remaining matching Submissions…",
          "last": {
            "multiple": "Loading the last {count} matching Submission… | Loading the last {count} matching Submissions…",
            "one": "Loading the last matching Submission…"
          }
        }
      },
      "entity": {
        // This text is shown when the number of Entities loading is unknown.
        "withoutCount": "Loading Entities…",
        "all": "Loading {count} Entity… | Loading {count} Entities…",
        // {top} is a number that is either 250 or 1000. {count} may be any number
        // that is at least 250. The string will be pluralized based on {count}.
        "first": "Loading the first {top} of {count} Entity… | Loading the first {top} of {count} Entities…",
        // {top} is a number that is either 250 or 1000. {count} may be any number
        // that is at least 250. The string will be pluralized based on {count}.
        "middle": "Loading {top} more of {count} remaining Entity… | Loading {top} more of {count} remaining Entities…",
        "last": {
          "multiple": "Loading the last {count} Entity… | Loading the last {count} Entities…",
          "one": "Loading the last Entity…"
        }
      }
    }
  }
  </i18n>
