<script setup lang="ts">
import IconSVG from '@/components/common/IconSVG.vue';
import {
	FORM_IMAGE_CACHE,
	FORM_OPTIONS,
	IS_FORM_EDIT_MODE,
	SUBMIT_PRESSED,
} from '@/lib/constants/injection-keys.ts';
import type { FormStateSuccessResult } from '@/lib/init/form-state.ts';
import { initializeFormState } from '@/lib/init/initialize-form-state.ts';
import type { EditInstanceOptions, FormOptions } from '@/lib/init/load-form-state.ts';
import { loadFormState } from '@/lib/init/load-form-state';
import { updateSubmittedFormState } from '@/lib/init/update-submitted-form-state.ts';
import type {
	HostSubmissionResultCallback,
	OptionalAwaitableHostSubmissionResult,
} from '@/lib/submission/host-submission-result-callback.ts';
import type { JRResourceURLString } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { ObjectURL } from '@getodk/common/lib/web-compat/url.ts';
import type {
	ChunkedInstancePayload,
	FetchFormAttachment,
	MissingResourceBehavior,
	MonolithicInstancePayload,
} from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import { computed, getCurrentInstance, provide, readonly, ref, shallowRef, watchEffect } from 'vue';
import FormLoadFailureDialog from '@/components/FormLoadFailureDialog.vue';
import FormHeader from '@/components/form-layout/FormHeader.vue';
import QuestionList from '@/components/form-layout/QuestionList.vue';

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

const isFormEditMode = shallowRef(false);
provide(IS_FORM_EDIT_MODE, readonly(isFormEditMode));

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

const formOptions = readonly<FormOptions>({
	fetchFormAttachment: props.fetchFormAttachment,
	missingResourceBehavior: props.missingResourceBehavior,
});
provide(FORM_OPTIONS, formOptions);
provide(FORM_IMAGE_CACHE, new Map<JRResourceURLString, ObjectURL>());

const state = initializeFormState();
const submitPressed = ref(false);
const floatingErrorActive = ref(false);
const showValidationError = ref(false);

const init = async () => {
	state.value = await loadFormState(props.formXml, {
		form: formOptions,
		editInstance: props.editInstance ?? null,
	});

	if (state.value.instance?.mode === 'edit') {
		isFormEditMode.value = true;
	}
};

void init();

const handleSubmit = (currentState: FormStateSuccessResult) => {
	const { root } = currentState;

	if (root.validationState.violations.length === 0) {
		floatingErrorActive.value = false;
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		emitSubmit(currentState);
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		emitSubmitChunked(currentState);
	} else {
		floatingErrorActive.value = true;
		submitPressed.value = true;
		document.scrollingElement?.scrollTo(0, 0);
	}
};

provide(SUBMIT_PRESSED, submitPressed);

const validationErrorMessage = computed(() => {
	const violationLength = state.value.root?.validationState.violations.length ?? 0;

	// TODO: translations
	if (violationLength === 0) return '';
	else if (violationLength === 1) return '1 question with error';
	else return `${violationLength} questions with errors`;
});

watchEffect(() => {
	if (floatingErrorActive.value && validationErrorMessage.value?.length) {
		showValidationError.value = true;
	} else {
		showValidationError.value = false;
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
			<div v-if="showValidationError" class="error-banner-placeholder" />
			<!-- Closable error message to clear the view and avoid overlap with other elements -->
			<Message v-if="showValidationError" severity="error" class="form-error-message" :closable="true" @close="floatingErrorActive = false">
				<IconSVG name="mdiAlertCircleOutline" variant="error" />
				<span>{{ validationErrorMessage }}</span>
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
				<img class="logo" src="../assets/images/odk-logo.svg" alt="ODK">
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
	font-family: var(--odk-font-family);
	font-weight: 400;
	font-size: var(--odk-base-font-size);
	background: var(--odk-muted-background-color);
	color: var(--odk-text-color);
	width: 100%;
	min-height: 100vh;

	.form-wrapper {
		display: flex;
		flex-direction: column;
		max-width: var(--odk-max-form-width);
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
			height: 4rem;
		}

		.form-error-message.p-message.p-message-error {
			position: fixed;
			z-index: var(--odk-z-index-error-banner);
			border-radius: var(--odk-radius);
			background-color: var(--odk-error-background-color);
			border: 1px solid var(--p-message-error-border-color);
			outline: none;
			max-width: var(--odk-max-form-width);
			width: 100%;
			margin: 0rem auto 1rem auto;
			top: 1rem;

			:deep(.p-message-wrapper) {
				padding: 8px 15px;
				flex-grow: 1;
			}

			:deep(.p-message-text) {
				display: flex;
				align-items: center;
				font-weight: 400;
			}

			.odk-icon {
				margin-right: 10px;
			}
		}
	}

	:deep(.p-button) {
		min-height: 40px;
	}

	.footer {
		margin: 1.5rem 0 0rem 0;

		button {
			min-width: 160px;
		}
	}

	.powered-by-wrapper {
		display: flex;
		align-items: center;
		flex-direction: column;
		padding: 140px 0 40px 0;
		background: var(--odk-muted-background-color);

		.anchor {
			color: var(--odk-muted-text-color);
			font-size: 18px;
			font-weight: 400;
			text-decoration: none;

			span.caption {
				display: inline-block;
			}

			img.logo {
				vertical-align: middle;
				width: 40px;
				margin-left: 4px;
				margin-top: -4px;
			}
		}

		.version {
			font-size: 14px;
			font-weight: 300;
			color: var(--odk-muted-text-color);
			margin-top: 5px;
		}
	}
}

@media screen and (max-width: #{pf.$lg - 1}) {
	.odk-form {
		background: var(--odk-base-background-color);

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
				margin: 4rem 1rem 0 1rem;
				max-width: unset;
				width: calc(100% - 2rem);
				top: 22px;
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
			background: var(--odk-base-background-color);
		}
	}
}

@media screen and (max-width: #{pf.$sm}) {
	.odk-form .form-wrapper .questions-card > :deep(.p-card-body) {
		padding: 2rem 0.5rem;
	}

	.odk-form .powered-by-wrapper {
		padding-top: 100px;

		.anchor {
			font-size: 14px;

			img.logo {
				width: 30px;
			}
		}

		.version {
			font-size: 11px;
			margin-top: 2px;
		}
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
</style>
