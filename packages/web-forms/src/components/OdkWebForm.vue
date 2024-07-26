<script setup lang="ts">
import { initializeForm, type RootNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Card from 'primevue/card';
import PrimeMessage from 'primevue/message';
import { computed, provide, reactive, ref } from 'vue';
import FormHeader from './FormHeader.vue';

import QuestionList from './QuestionList.vue';

const props = defineProps<{ formXml: string }>();

const odkForm = ref<RootNode>();

const submitPressed = ref(false);

const emit = defineEmits(['submit']);

initializeForm(props.formXml, {
	config: {
		stateFactory: reactive
	},
}).then((f) => {
	odkForm.value = f;
  }).catch(() => {}); // eslint-disable-line -- noop

const handleSubmit = () => {
	if(odkForm.value?.validationState.violations?.length === 0){
		emit('submit');
	}
	else{
		submitPressed.value = true;
		window.scrollTo({top: 0, behavior: 'smooth'});
	}
}

provide('submitPressed', submitPressed);

const formErrorMessage = computed(() => {
	const violationLength = odkForm.value!.validationState.violations.length;

	if(violationLength === 0) return '';
	else if(violationLength === 1) return '1 question with error';
	else return `${violationLength} questions with errors`;
});

const scrollToFirstInvalidQuestion = () => {
	document.getElementById(odkForm.value!.validationState.violations[0].nodeId + '_container')?.scrollIntoView({
		behavior: 'smooth'
	});
}
</script>

<template>
	<div v-if="odkForm" class="odk-form" :class="{ 'submit-pressed': submitPressed }">
		<div class="form-wrapper">
			<PrimeMessage v-if="formErrorMessage" v-show="submitPressed" severity="error" icon="icon-error_outline" class="form-error-message" :closable="false">
				{{ formErrorMessage }}
				<span class="fix-errors" @click="scrollToFirstInvalidQuestion()">Fix errors</span>
			</PrimeMessage>

			<FormHeader :form="odkForm" />

			<Card class="questions-card">
				<template #content>
					<div class="form-questions">
						<div class="flex flex-column gap-2">
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

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

.odk-form {
	width: 100%;
	color: var(--text-color);

	.form-wrapper {
		display: flex;
		flex-direction: column;
		max-width: 900px;
		margin: auto;
		padding-top: 10px;
		padding-bottom: 20px;

		.questions-card {
			border-radius: 10px;
			box-shadow: var(--light-elevation-1);
			border-top: none;
			margin-top: 20px;

			:deep(.p-card-content) {
				padding: 0;
			}
		}

		.form-error-message.p-message.p-message-error {
			border-radius: 10px;
			background-color: var(--error-bg-color);
			border: 1px solid var(--error-text-color);
			width: 70%;
			margin: 0rem auto 1rem auto;
			position: sticky;
			top: 0;
			// Some PrimeVue components use z-index.
			// Default value for those are either 1000 or 1100
			// So 5000 here is safe.
			z-index: 5000;

			:deep(.p-message-wrapper) {
				padding: 0.75rem 0.75rem;
				flex-grow: 1;
			}

			:deep(.p-message-text){
				font-weight: 400;
				flex-grow: 1;

				.fix-errors {
					float: right;
					cursor: pointer;
				}
			}

		}
	}

	.print-button.p-button {
		height: 2rem;
		width: 2rem;
	}

	.footer {
		margin-top: 20px;

		button {
			min-width: 160px;
		}
	}

}

@media screen and (max-width: #{$lg - 1}) {
	.odk-form {
		.form-wrapper {
			max-width: unset;
			padding-top: unset;

			:deep(.title-bar){
				order: 1;
			}

			.form-error-message.p-message.p-message-error {
				margin: 1rem 1rem 0 1rem;
				order: 2;
				width: calc(100% - 2rem);
			}

			.questions-card {
				border-radius: unset;
				box-shadow: unset;
				margin-top: 0;
				order: 3;
			}
			
			.footer {
				order: 4;
				button {
					margin-right: 20px;
				}
			}
		}
	}
}
</style>

<style lang="scss">
@import 'primeflex/core/_variables.scss';
:root {
	--breakpoint-lg: #{$lg};
}

body {
	background: var(--gray-200);
}
@media screen and (max-width: #{$lg - 1}) {
	body {
		background: white;
	}
}
</style>
