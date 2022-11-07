<template>
    <summary-item v-if="datasetDiff.length > 0" icon="link">
        <template #heading>
        {{ datasetDiff.length }}
        </template>
        <template #body>
            <p>Datasets are updated by this Form:</p>
            <template v-for="(dataset, index) in datasetDiff" :key="dataset.name">
                <row :dataset="dataset"/>
                <hr v-if="index < datasetDiff.length - 1">
            </template>
        </template>
    </summary-item>
</template>

<script>
import SummaryItem from '../summary-item.vue';
import { useRequestData } from '../../request-data';
import Row from './row.vue';

export default {
  name: 'DatasetSummary',
  components: { SummaryItem, Row },
  props: {
    isDraft: {
      type: Boolean,
      Default: false
    }
  },
  setup(props) {
    const { formDraftDatasetDiff, formDatasetDiff } = useRequestData();
    return { datasetDiff: props.isDraft ? formDraftDatasetDiff : formDatasetDiff };
  }
};
</script>
