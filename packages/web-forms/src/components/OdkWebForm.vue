<script setup lang="ts">
import type { FormStateSuccessResult } from '@/lib/init/FormState.ts';
import { initializeFormState } from '@/lib/init/initializeFormState.ts';
import type { EditInstanceOptions } from '@/lib/init/loadFormState';
import { loadFormState } from '@/lib/init/loadFormState';
import { updateSubmittedFormState } from '@/lib/init/updateSubmittedFormState.ts';
import type {
	HostSubmissionResultCallback,
	OptionalAwaitableHostSubmissionResult,
} from '@/lib/submission/HostSubmissionResultCallback.ts';
import type {
	ChunkedInstancePayload,
	FetchFormAttachment,
	MissingResourceBehavior,
	MonolithicInstancePayload,
} from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import type { ComponentPublicInstance } from 'vue';
import { computed, getCurrentInstance, provide, ref, watchEffect } from 'vue';
import FormLoadFailureDialog from './Form/FormLoadFailureDialog.vue';
import FormHeader from './FormHeader.vue';
import QuestionList from './QuestionList.vue';

const webFormsVersion = __WEB_FORMS_VERSION__;

export interface OdkWebFormsProps {
	readonly formXml: string;
	readonly fetchFormAttachment: FetchFormAttachment;
	readonly missingResourceBehavior?: MissingResourceBehavior;

	/**
	 * Note: this parameter must be set when subscribing to the
	 * {@link OdkWebFormEmits.submitChunked | submitChunked} event.
	 */
	readonly submissionMaxSize?: number;

	/**
	 * If provided by a host application, referenced instance and attachment
	 * resources will be resolved and loaded for editing.
	 */
	readonly editInstance?: EditInstanceOptions;
}

const props = defineProps<OdkWebFormsProps>();

const hostSubmissionResultCallbackFactory = (
	currentState: FormStateSuccessResult
): HostSubmissionResultCallback => {
	const handleHostSubmissionResult = async (
		hostResult: OptionalAwaitableHostSubmissionResult
	): Promise<void> => {
		const submissionResult = await hostResult;

		state.value = updateSubmittedFormState(submissionResult, currentState);
	};

	return (hostResult) => {
		void handleHostSubmissionResult(hostResult);
	};
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- evidently a type must be used for this to be assigned to a name (which we use!); as an interface, it won't satisfy the `Record` constraint of `defineEmits`.
type OdkWebFormEmits = {
	submit: [submissionPayload: MonolithicInstancePayload, callback: HostSubmissionResultCallback];
	submitChunked: [
		submissionPayload: ChunkedInstancePayload,
		callback: HostSubmissionResultCallback,
	];
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
const componentInstance = getCurrentInstance();

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
 * @see {@link componentInstance}
 * @see {@link EventKey}
 */
const isEmitSubscribed = (eventKey: EventKey): boolean => {
	return eventKey in (componentInstance?.vnode.props ?? {});
};

const emitSubmit = async (currentState: FormStateSuccessResult) => {
	if (isEmitSubscribed('onSubmit')) {
		const payload = await currentState.root.prepareInstancePayload({
			payloadType: 'monolithic',
		});
		const callback = hostSubmissionResultCallbackFactory(currentState);

		emit('submit', payload, callback);
	}
};

const emitSubmitChunked = async (currentState: FormStateSuccessResult) => {
	if (isEmitSubscribed('onSubmitChunked')) {
		const maxSize = props.submissionMaxSize;

		if (maxSize == null) {
			throw new Error('The `submissionMaxSize` prop is required for chunked submissions');
		}

		const payload = await currentState.root.prepareInstancePayload({
			payloadType: 'chunked',
			maxSize,
		});
		const callback = hostSubmissionResultCallbackFactory(currentState);

		emit('submitChunked', payload, callback);
	}
};

const emit = defineEmits<OdkWebFormEmits>();

const state = initializeFormState();
const submitPressed = ref(false);

const init = async () => {
	state.value = await loadFormState(props.formXml, {
		form: {
			fetchFormAttachment: props.fetchFormAttachment,
			missingResourceBehavior: props.missingResourceBehavior,
		},
		editInstance: props.editInstance ?? null,
	});
};

void init();

const handleSubmit = (currentState: FormStateSuccessResult) => {
	const { root } = currentState;

	if (root.validationState.violations.length === 0) {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		emitSubmit(currentState);
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		emitSubmitChunked(currentState);
	} else {
		submitPressed.value = true;
		document.scrollingElement?.scrollTo(0, 0);
	}
};

const validationErrorMessagePopover = ref<ComponentPublicInstance | null>(null);

provide('submitPressed', submitPressed);

const validationErrorMessage = computed(() => {
	const violationLength = state.value.root?.validationState.violations.length ?? 0;

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
			loading: state.status === 'FORM_STATE_LOADING',
			error: state.status === 'FORM_STATE_FAILURE',
			ready: state.status === 'FORM_STATE_SUCCESS',
		}"
	/>

	<template v-if="state.status === 'FORM_STATE_FAILURE'">
		<FormLoadFailureDialog
			severity="error"
			:error="state.error"
		/>
	</template>

	<div
		v-else-if="state.status === 'FORM_STATE_SUCCESS'"
		class="odk-form"
		:class="{ 'submit-pressed': submitPressed }"
	>
		<div class="form-wrapper">
			<div v-show="submitPressed && validationErrorMessage" class="error-banner-placeholder" />
			<Message ref="validationErrorMessagePopover" popover="manual" severity="error" icon="icon-error_outline" class="form-error-message" :closable="false">
				{{ validationErrorMessage }}
			</Message>

			<FormHeader :form="state.root" />

			<Card class="questions-card">
				<template #content>
					<div class="form-questions">
						<div class="flex flex-column gap-2">
							<QuestionList :nodes="state.root.currentState.children" />
						</div>
					</div>
				</template>
			</Card>

			<div class="footer flex justify-content-end flex-wrap gap-3">
				<Button label="Send" @click="handleSubmit(state)" />
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
@use 'primeflex/core/_variables.scss' as pf;

.form-initialization-status {
	display: none;
}

.odk-form {
	width: 100%;
	color: var(--odk-text-color);
	--wf-error-banner-gap: 4rem;
	--wf-max-form-width: 900px;

	.form-wrapper {
		display: flex;
		flex-direction: column;
		max-width: var(--wf-max-form-width);
		min-height: calc(100vh - 5.5rem);
		margin: auto;
		padding-top: 10px;

		.questions-card {
			border-radius: var(--odk-radius);
			box-shadow: none;
			border-top: none;
			margin-top: 20px;
		}

		.questions-card > :deep(.p-card-body) {
			padding: 2rem;
		}

		.error-banner-placeholder {
			height: var(--wf-error-banner-gap);
		}

		.form-error-message.p-message.p-message-error {
			border-radius: var(--odk-radius);
			background-color: var(--odk-error-background-color);
			border: 1px solid var(--p-message-error-border-color);
			outline: none;
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
			color: var(--odk-muted-text-color);
			font-size: var(--odk-hint-font-size);
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
			color: var(--odk-muted-text-color);
		}
	}
}

@media screen and (max-width: #{pf.$lg - 1}) {
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

@media screen and (max-width: #{pf.$sm}) {
	.odk-form .form-wrapper .questions-card > :deep(.p-card-body) {
		padding: 2rem 0.5rem;
	}
}
</style>

<style lang="scss">
@use 'primeflex/core/_variables.scss' as pf;
:root {
	// This variable is used to assert the breakpoint from PrimeFlex are loaded
	// {@link https://github.com/getodk/web-forms/blob/main/packages/web-forms/e2e/test-cases/build/style.test.ts}
	--odk-test-breakpoint-lg: #{pf.$lg};
}

body {
	background: var(--odk-muted-background-color);
}

@media screen and (max-width: #{pf.$lg - 1}) {
	body {
		background: var(--odk-base-background-color);
	}
}
</style>
