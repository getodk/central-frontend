<script setup lang="ts">
import type {
	ChunkedSubmissionResult,
	MissingResourceBehavior,
	MonolithicSubmissionResult,
} from '@getodk/xforms-engine';
import { initializeForm, type FetchFormAttachment, type RootNode } from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Card from 'primevue/card';
import PrimeMessage from 'primevue/message';
import type { ComponentPublicInstance } from 'vue';
import { computed, getCurrentInstance, provide, reactive, ref, watchEffect } from 'vue';
import { FormInitializationError } from '../lib/error/FormInitializationError.ts';
import FormLoadFailureDialog from './Form/FormLoadFailureDialog.vue';
import FormHeader from './FormHeader.vue';
import QuestionList from './QuestionList.vue';

const webFormsVersion = __WEB_FORMS_VERSION__;

interface OdkWebFormsProps {
	formXml: string;
	fetchFormAttachment: FetchFormAttachment;
	missingResourceBehavior?: MissingResourceBehavior;

	/**
	 * Note: this parameter must be set when subscribing to the
	 * {@link OdkWebFormEmits.submitChunked | submitChunked} event.
	 */
	submissionMaxSize?: number;
}

const props = defineProps<OdkWebFormsProps>();

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- evidently a type must be used for this to be assigned to a name (which we use!); as an interface, it won't satisfy the `Record` constraint of `defineEmits`.
type OdkWebFormEmits = {
	submit: [submissionPayload: MonolithicSubmissionResult];
	submitChunked: [submissionPayload: ChunkedSubmissionResult];
};

/**
 * Supports {@link isEmitSubscribed}.
 *
 * @see
 * {@link https://mokkapps.de/vue-tips/check-if-component-has-event-listener-attached}
 *
 * Usage here is intentionally different from the linked article: for reasons
 * unknown, {@link getCurrentInstance} returns `null` called in a
 * {@link computed} function body (or any function body), but produces the
 * expected value assigned to a top level value as it is here.
 */
const instance = getCurrentInstance();

type OdkWebFormEmitsEventType = keyof OdkWebFormEmits;

/**
 * A Vue _template_ event handler is subscribed with syntax like:
 *
 * ```vue
 * <OdkWebForm @whatever-event-type="handler" />
 * ```
 *
 * At runtime, its props key is a concatenation of the prefix "on" and the
 * PascalCase variant of the same event type. Since we already
 * {@link defineEmits} in camelCase, this type represents that key format.
 */
type EventKey = `on${Capitalize<OdkWebFormEmitsEventType>}`;

/**
 * @see {@link https://mokkapps.de/vue-tips/check-if-component-has-event-listener-attached}
 * @see {@link instance}
 * @see {@link EventKey}
 */
const isEmitSubscribed = (eventKey: EventKey): boolean => {
	return eventKey in (instance?.vnode.props ?? {});
};

const emitSubmit = async (root: RootNode) => {
	if (isEmitSubscribed('onSubmit')) {
		const payload = await root.prepareSubmission({
			chunked: 'monolithic',
		});

		emit('submit', payload);
	}
};

const emitSubmitChunked = async (root: RootNode) => {
	if (isEmitSubscribed('onSubmitChunked')) {
		const maxSize = props.submissionMaxSize;

		if (maxSize == null) {
			throw new Error('The `submissionMaxSize` prop is required for chunked submissions');
		}

		const payload = await root.prepareSubmission({
			chunked: 'chunked',
			maxSize,
		});

		emit('submitChunked', payload);
	}
};

const emit = defineEmits<OdkWebFormEmits>();

const odkForm = ref<RootNode>();
const submitPressed = ref(false);
const initializeFormError = ref<FormInitializationError | null>();

initializeForm(props.formXml, {
	config: {
		fetchFormAttachment: props.fetchFormAttachment,
		missingResourceBehavior: props.missingResourceBehavior,
		stateFactory: reactive,
	},
})
	.then((f) => {
		odkForm.value = f;
	})
	.catch((cause) => {
		initializeFormError.value = new FormInitializationError(cause);
	});

const handleSubmit = () => {
	const root = odkForm.value;

	if (root?.validationState.violations?.length === 0) {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		emitSubmit(root);
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		emitSubmitChunked(root);
	} else {
		submitPressed.value = true;
		document.scrollingElement?.scrollTo(0, 0);
	}
};

const validationErrorMessagePopover = ref<ComponentPublicInstance | null>(null);

provide('submitPressed', submitPressed);

const validationErrorMessage = computed(() => {
	const violationLength = odkForm.value!.validationState.violations.length;

	// TODO: translations
	if (violationLength === 0) return '';
	else if (violationLength === 1) return '1 question with error';
	else return `${violationLength} questions with errors`;
});

watchEffect(() => {
	if (submitPressed.value && validationErrorMessage.value) {
		(validationErrorMessagePopover.value?.$el as HTMLElement)?.showPopover?.();
	} else {
		(validationErrorMessagePopover.value?.$el as HTMLElement)?.hidePopover?.();
	}
});
</script>
<!--
	TODO: consider handling all template control flow on `<template>` tags! While
	`v-if` and similar Vue directives are available on HTML and component tags,
	using `<template>` could help make it much more clear where control flow
	exists. And it could help make it much more clear what props are actually
	applicable for usage of a given tag.
-->
<template>
	<div
		:class="{
			'form-initialization-status': true,
			loading: odkForm == null && initializeFormError == null,
			error: initializeFormError != null,
			ready: odkForm != null,
		}"
	/>

	<template v-if="initializeFormError != null">
		<FormLoadFailureDialog
			severity="error"
			:error="initializeFormError"
		/>
	</template>

	<div
		v-else-if="odkForm"
		class="odk-form"
		:class="{ 'submit-pressed': submitPressed }"
	>
		<div class="form-wrapper">
			<div v-show="submitPressed && validationErrorMessage" class="error-banner-placeholder" />
			<PrimeMessage ref="validationErrorMessagePopover" popover="manual" severity="error" icon="icon-error_outline" class="form-error-message" :closable="false">
				{{ validationErrorMessage }}
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
					srcset="../assets/images/odk-logo-small@1x.png, ../assets/images/odk-logo-small@2x.png 2x"
					src="../assets/images/odk-logo-small@2x.png"
					alt="ODK"
					height="15"
					width="28"
				>
			</a>
			<div class="version">
				{{ webFormsVersion }}
			</div>
		</div>
	</div>
</template>

<style scoped lang="scss">
@import 'primeflex/core/_variables.scss';

.form-initialization-status {
	display: none;
}

.odk-form {
	width: 100%;
	color: var(--text-color);
	--wf-error-banner-gap: 4rem;
	--wf-max-form-width: 900px;

	.form-wrapper {
		display: flex;
		flex-direction: column;
		max-width: var(--wf-max-form-width);
		min-height: calc(100vh - 5.5rem);
		min-height: calc(100dvh - 5.5rem);
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
		margin-top: 2rem;
		margin-bottom: 1rem;
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

		.version {
			font-size: 0.7rem;
			margin: 0.5rem 0 0 0.85rem;
			color: var(--gray-500);
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
