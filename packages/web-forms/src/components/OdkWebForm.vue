<script setup lang="ts">
import { initializeForm, type RootNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Card from 'primevue/card';
import { reactive, ref } from 'vue';
import FormHeader from './FormHeader.vue';

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
  }).catch(() => {}); // eslint-disable-line -- noop

const handleSubmit = () => {
	emit('submit');
}
</script>

<template>
	<div v-if="odkForm" class="odk-form">
		<div class="form-wrapper">
			<FormHeader :form="odkForm" />

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

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

.odk-form {
	width: 100%;
	color: var(--text-color);

	.form-wrapper {
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
				padding: 1rem;
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

			.questions-card {
				border-radius: unset;
				box-shadow: unset;
				margin-top: 0;
			}
			.footer {

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
