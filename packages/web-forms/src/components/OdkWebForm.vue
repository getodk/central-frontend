<script setup lang="ts">
import { initializeForm, type RootNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Card from 'primevue/card';
import PrimeMessage from 'primevue/message';
import { computed, provide, reactive, ref, watchEffect, type ComponentPublicInstance } from 'vue';
import FormHeader from './FormHeader.vue';

import QuestionList from './QuestionList.vue';

const props = defineProps<{ formXml: string }>();

const odkForm = ref<RootNode>();

const submitPressed = ref(false);

const emit = defineEmits(['submit']);

initializeForm(props.formXml, {
	config: {
		stateFactory: reactive,
	},
})
	.then((f) => {
		odkForm.value = f;
	})
	.catch((error) => {
		// eslint-disable-next-line no-console
		console.error(error);
	});

const handleSubmit = () => {
	if (odkForm.value?.validationState.violations?.length === 0) {
		emit('submit');
	} else {
		submitPressed.value = true;
		document.scrollingElement?.scrollTo(0, 0);
	}
};

const errorMessagePopover = ref<ComponentPublicInstance | null>(null);

provide('submitPressed', submitPressed);

const formErrorMessage = computed(() => {
	const violationLength = odkForm.value!.validationState.violations.length;

	// TODO: translations
	if (violationLength === 0) return '';
	else if (violationLength === 1) return '1 question with error';
	else return `${violationLength} questions with errors`;
});

watchEffect(() => {
	if (submitPressed.value && formErrorMessage.value) {
		(errorMessagePopover.value?.$el as HTMLElement)?.showPopover?.();
	} else {
		(errorMessagePopover.value?.$el as HTMLElement)?.hidePopover?.();
	}
});
</script>

<template>
	<div v-if="odkForm" class="odk-form" :class="{ 'submit-pressed': submitPressed }">
		<div class="form-wrapper">
			<div v-show="submitPressed && formErrorMessage" class="error-banner-placeholder" />
			<PrimeMessage ref="errorMessagePopover" popover="manual" severity="error" icon="icon-error_outline" class="form-error-message" :closable="false">
				{{ formErrorMessage }}
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
				<Button label="Send" rounded @click="handleSubmit()" />
			</div>
		</div>

		<div class="powered-by-wrapper">
			<a class="anchor" href="https://getodk.org" target="_blank">
				<span class="caption">Powered by</span>
				<img
					class="logo"
					srcset="../assets/images/odk-logo-small@1x.png,
								  ../assets/images/odk-logo-small@2x.png 2x"
					src="../assets/images/odk-logo-small@2x.png"
					alt="ODK"
					height="15"
					width="28"
				>
			</a>
		</div>
	</div>
</template>

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

.odk-form {
	width: 100%;
	color: var(--text-color);
	--wf-error-banner-gap: 4rem;
	--wf-max-form-width: 900px;

	.form-wrapper {
		display: flex;
		flex-direction: column;
		max-width: var(--wf-max-form-width);
		min-height: calc(100vh - 5rem);
		min-height: calc(100dvh - 5rem);
		margin: auto;
		padding-top: 10px;

		.questions-card {
			border-radius: 10px;
			box-shadow: none;
			border-top: none;
			margin-top: 20px;

			:deep(.p-card-content) {
				padding: 0;
			}
		}

		.error-banner-placeholder {
			height: calc(var(--wf-error-banner-gap) + 1rem);
		}

		.form-error-message.p-message.p-message-error {
			border-radius: 10px;
			background-color: var(--error-bg-color);
			border: 1px solid var(--error-text-color);
			max-width: var(--wf-max-form-width);
			width: 100%;
			margin: 0rem auto 1rem auto;
			top: 1rem;

			:deep(.p-message-wrapper) {
				padding: 0.75rem 0.75rem;
				flex-grow: 1;
			}

			:deep(.p-message-text) {
				font-weight: 400;
				flex-grow: 1;
			}
		}
	}

	.print-button.p-button {
		height: 2rem;
		width: 2rem;
	}

	.footer {
		margin: 1.5rem 0 0rem 0;

		button {
			min-width: 160px;
		}
	}

	.powered-by-wrapper {
		margin-top: 3rem;
		margin-bottom: 0.5rem;
		margin-left: 0.5rem;

		.anchor {
			color: var(--gray-500);
			font-size: 0.85rem;
			font-weight: 300;
			text-decoration: none;
			margin-left: 1rem;

			span.caption {
				transform: scale(1.1, 1);
				display: inline-block;
				margin-right: 3px;
			}

			img.logo {
				vertical-align: middle;
				margin-left: 0.2rem;
			}
		}
	}
}

@media screen and (max-width: #{$lg - 1}) {
	.odk-form {
		.form-wrapper {
			max-width: unset;
			padding-top: unset;

			:deep(.title-bar) {
				order: 1;
			}

			.error-banner-placeholder {
				order: 2;
			}

			.form-error-message.p-message.p-message-error {
				margin: var(--wf-error-banner-gap) 1rem 0 1rem;
				max-width: unset;
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
		.powered-by-wrapper {
			padding-bottom: 10px;
			margin-bottom: 0;
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
