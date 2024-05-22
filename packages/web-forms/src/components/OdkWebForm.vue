<script setup lang="ts">
import { initializeForm, type RootNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Card from 'primevue/card';
import { reactive, ref } from 'vue';
import FormHeader from './FormHeader.vue';
import FormLanguageMenu from './FormLanguageMenu.vue';
import QuestionList from './QuestionList.vue';

const props = defineProps<{ formXml: string }>();

const odkForm = ref<RootNode>();

const emit = defineEmits(['submit']);

initializeForm(props.formXml, {
	config: {
		stateFactory: reactive
	},
}).then((f) => {
	odkForm.value = f;
	// TODO/sk: remove once dust settles
	// eslint-disable-next-line -- temporary code
		console.log((f as any).childrenState.getChildren());
  }).catch(() => {}); // eslint-disable-line -- noop

const handleSubmit = () => {
	emit('submit');
}

const print = () => window.print();
</script>

<template>
	<div v-if="odkForm" class="odk-form">
		<div class="form-wrapper">
			<div class="odk-menu-bar flex justify-content-end flex-wrap gap-3">
				<Button severity="secondary" rounded icon="icon-local_printshop" @click="print" />
				<FormLanguageMenu :form="odkForm" />
			</div>

			<!-- TODO/q: should the title be on the definition or definition.form be accessible instead of definition.bind.form -->
			<FormHeader :title="odkForm.definition.bind.form.title" />

			<Card class="questions-card">
				<template #content>
					<div class="form-questions">
						<div class="flex flex-column gap-5">
							<QuestionList :nodes="odkForm.currentState.children" />
						</div>
					</div>
				</template>
			</Card>

			<div class="footer flex justify-content-end flex-wrap gap-3">
				<!-- maybe current state is in odkForm.state.something -->
				<Button label="Send" rounded raised @click="handleSubmit()" />
			</div>
		</div>
	</div>
</template>

