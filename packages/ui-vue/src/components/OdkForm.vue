<template>
	<div v-if="odkForm" class="odk-form">
		<div class="form-wrapper">
			<FormMenuBar />

			<!-- TODO/q: should the title be on the definition or definition.form be accessible instead of definition.bind.form -->
			<OdkFormHeader :title="odkForm.definition.bind.form.title" />

			<Card class="questions-card">
				<template #content>
					<div class="form-questions">
						<div class="flex flex-column gap-5">
							<OdkQuestionList :questions="odkForm.currentState.children"/>
						</div>
					</div>
				</template>
			</Card>

			<div class="footer flex justify-content-end flex-wrap gap-3">
				<Button label="Save as draft" severity="secondary" rounded raised />
				<Button label="Send" rounded raised />
			</div>
		</div>		
	</div>	
</template>

<script setup lang="ts">
import { initializeForm, type RootNode } from '@odk-web-forms/xforms-engine';
import Button from 'primevue/button';
import Card from 'primevue/card';
import { ref } from 'vue';
import OdkFormHeader from './OdkFormHeader.vue';
import FormMenuBar from './OdkMenuBar.vue';
import OdkQuestionList from './OdkQuestionList.vue';

const props = defineProps<{ formXml: string }>();

const odkForm = ref<RootNode>();

const container = ref<Element | null>(null);
const ccc = ref<Element | null>(null);

initializeForm(props.formXml, {
    config: {
      // TODO/sk: to replace with 'ref'
      stateFactory: (input) => {
        return input;
      },
    },
  }).then((f) => {
    // console.log(f);
    odkForm.value = f;
		
  });
</script>

<style>

</style>