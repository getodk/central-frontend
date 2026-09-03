<script setup lang="ts">
import FormLoadFailureDialog from '@getodk/web-forms/components/FormLoadFailureDialog.vue';
import IconSVG from '@getodk/web-forms/components/common/IconSVG.vue';
import FormFooter from '@getodk/web-forms/components/form-layout/FormFooter.vue';
import FormHeader from '@getodk/web-forms/components/form-layout/FormHeader.vue';
import QuestionList from '@getodk/web-forms/components/form-layout/QuestionList.vue';
import { waitAllTasksToFinish } from '@getodk/web-forms/lib/async/event-loop.ts';
import {
	TRANSLATE,
	FORM_MEDIA_CACHE,
	FORM_OPTIONS,
	IS_FORM_EDIT_MODE,
	SUBMIT_PRESSED,
	TOUCHED_QUESTIONS,
} from '@getodk/web-forms/lib/constants/injection-keys.ts';
import type { FormStateSuccessResult } from '@getodk/web-forms/lib/init/form-state.ts';
import { initializeFormState } from '@getodk/web-forms/lib/init/initialize-form-state.ts';
import { loadFormState } from '@getodk/web-forms/lib/init/load-form-state';
import type { EditInstanceOptions, FormOptions } from '@getodk/web-forms/lib/init/load-form-state.ts';
import { getCurrentPageViolations } from '@getodk/web-forms/lib/pagination/pagination.ts';
import { useNavigationTarget } from '@getodk/web-forms/lib/useNavigationTarget.ts';
import { updateSubmittedFormState } from '@getodk/web-forms/lib/init/update-submitted-form-state.ts';
import { geolocationService } from '@getodk/web-forms/lib/services/geolocationService.ts';
import { useLocale } from '@getodk/web-forms/lib/locale/useLocale.ts';
import type {
	HostSubmissionResultCallback,
	OptionalAwaitableHostSubmissionResult,
} from '@getodk/web-forms/lib/submission/host-submission-result-callback.ts';
import type { JRResourceURLString } from '@getodk/common/jr-resources/JRResourceURL.ts';
import type {
	ChunkedInstancePayload,
	FetchFormAttachment,
	MissingResourceBehavior,
	MonolithicInstancePayload,
	InstanceDefaults,
	PreloadProperties,
} from '@getodk/xforms-engine';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import {
	computed,
	getCurrentInstance,
	onErrorCaptured,
	onUnmounted,
	provide,
	reactive,
	readonly,
	ref,
	watch,
} from 'vue';
import { FormInitializationError } from '@getodk/web-forms/lib/error/FormInitializationError';

const webFormsVersion = __WEB_FORMS_VERSION__;
type ObjectURL = `blob:${string}`;

export interface OdkWebFormsProps {
	readonly formXml: string;
	readonly fetchFormAttachment: FetchFormAttachment;
	readonly deviceId?: string; // different case to make it easier to bind
	readonly preloadProperties?: PreloadProperties;
	readonly instanceDefaults?: InstanceDefaults;
	readonly missingResourceBehavior?: MissingResourceBehavior;
	readonly attachmentMaxSize?: number;

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

	readonly lastSavedXml?: string;
}

const props = defineProps<OdkWebFormsProps>();

const hostSubmissionResultCallbackFactory = (
	currentState: FormStateSuccessResult
): HostSubmissionResultCallback => {
	const handleHostSubmissionResult = async (
		hostResult: OptionalAwaitableHostSubmissionResult
	): Promise<void> => {
		const submissionResult = await hostResult;

		// Use the current instance XML as the last-saved for the next submission. Using the copy in memory
		// means we don't need to fetch it from the vue app, and also means it works for draft forms where
		// the last-saved is never persisted.
		const lastSavedXml = currentState.root.instanceState.instanceXML;
		const options = {
			form: formOptions,
			preloadProperties: props.preloadProperties,
			instanceDefaults: props.instanceDefaults,
			deviceID: props.deviceId,
			lastSavedXml
		};
		state.value = updateSubmittedFormState(submissionResult, currentState, options);
	};

	return (hostResult) => {
		resetComponentState();
		void handleHostSubmissionResult(hostResult);
	};
};

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- evidently a type must be used for this to be assigned to a name (which we use!); as an interface, it won't satisfy the `Record` constraint of `defineEmits`.
type OdkWebFormEmits = {
	loaded: [],
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
		await waitAllTasksToFinish();
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

		await waitAllTasksToFinish();
		const payload = await currentState.root.prepareInstancePayload({
			payloadType: 'chunked',
			maxSize,
		});
		const callback = hostSubmissionResultCallbackFactory(currentState);

		emit('submitChunked', payload, callback);
	}
};

const emit = defineEmits<OdkWebFormEmits>();

const getLocation = async (): Promise<string> => {
	let point = '';
	try {
		geolocationErrorMessage.value = '';
		point = await geolocationService.getCurrentPosition();
	} catch (error) {
		// eslint-disable-next-line no-console -- Skip silently to match Collect behaviour.
		console.warn('Error occurred while retrieving background location.', error);
		geolocationErrorMessage.value = t('odk_web_forms.geolocation.error');
		errorBannerDismissed.value = false;
	}

	return point;
};

const formOptions = readonly<FormOptions>({
	fetchFormAttachment: props.fetchFormAttachment,
	lastSavedXml: props.lastSavedXml,
	missingResourceBehavior: props.missingResourceBehavior,
	geolocationProvider: { getLocation: () => getLocation() },
	attachmentMaxSize: props.attachmentMaxSize,
});
provide(FORM_OPTIONS, formOptions);
const mediaCache = new Map<JRResourceURLString, ObjectURL>();
provide(FORM_MEDIA_CACHE, mediaCache);

const state = initializeFormState();
const runtimeError = ref<FormInitializationError | null>(null);
const submitPressed = ref(false);
const touchedQuestions = reactive(new Set<string>());
// Close hides the banner until the next failed submit, blocked Next or geolocation error.
const errorBannerDismissed = ref(false);
const geolocationErrorMessage = ref<string | null>(null);
const isFormEditMode = ref(false);
provide(IS_FORM_EDIT_MODE, readonly(isFormEditMode));
const { setLanguage, t } = useLocale(computed(() => state.value.root));
provide(TRANSLATE, t);
const { navigateToFirstViolation, navigateToNode } = useNavigationTarget(() => state.value.root);

onErrorCaptured(err => {
	runtimeError.value = FormInitializationError.from(err);
});

watch(
	() => state.value,
	(newState) => {
		isFormEditMode.value = newState.instance?.mode === 'edit';
	},
	{ immediate: true }
);

const resetComponentState = () => {
	submitPressed.value = false;
	touchedQuestions.clear();
	errorBannerDismissed.value = false;
	geolocationErrorMessage.value = null;
	geolocationService.teardown();
};

const init = async () => {
	state.value = await loadFormState(props.formXml, {
		form: formOptions,
		editInstance: props.editInstance ?? null,
		preloadProperties: props.preloadProperties,
		instanceDefaults: props.instanceDefaults,
		deviceID: props.deviceId
	});
	emit('loaded');
};

void init();

const releaseFocus = () => {
	const active = document.activeElement;
	if (active instanceof HTMLElement) {
		active.blur();
	}
};

const handleSubmit = (currentState: FormStateSuccessResult) => {
	const { root } = currentState;
	releaseFocus(); // so follow-up dialogs don't restore focus here and scroll back to it

	if (root.validationState.violations.length === 0) {
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		emitSubmit(currentState);
		// eslint-disable-next-line @typescript-eslint/no-floating-promises
		emitSubmitChunked(currentState);
	} else {
		errorBannerDismissed.value = false;
		submitPressed.value = true;
		navigateToFirstViolation();
	}
};

const handleNext = (currentState: FormStateSuccessResult) => {
	const violations = getCurrentPageViolations(currentState.root);
	if (!violations.length) {
		currentState.root.nextPage();
		return;
	}

	violations.forEach((violation) => touchedQuestions.add(violation.nodeId));
	errorBannerDismissed.value = false;
	navigateToNode(violations[0]?.nodeId);
};

provide(SUBMIT_PRESSED, submitPressed);
provide(TOUCHED_QUESTIONS, touchedQuestions);

// It returns violations for questions the user has seen.
const revealedViolations = computed(() => {
	const violations = state.value.root?.validationState.violations ?? [];
	if (submitPressed.value) {
		return violations;
	}
	return violations.filter(({ nodeId }) => touchedQuestions.has(nodeId));
});

const validationErrorMessage = computed(() => {
	if (!revealedViolations.value.length) {
    return '';
  }
	return t('odk_web_forms.validation.error', { count: revealedViolations.value.length });
});

const showValidationError = computed(() => {
	if (errorBannerDismissed.value) {
		return false;
	}
	return !!(validationErrorMessage.value.length || geolocationErrorMessage.value?.length);
});

onUnmounted(() => {
	mediaCache.forEach((url) => URL.revokeObjectURL(url));
	mediaCache.clear();
	resetComponentState();
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
		<FormLoadFailureDialog :error="state.error" />
	</template>

	<template v-else-if="runtimeError">
		<FormLoadFailureDialog :error="runtimeError" />
	</template>

	<div
		v-else-if="state.status === 'FORM_STATE_SUCCESS'"
		class="odk-form"
		:class="{ 'submit-pressed': submitPressed }"
	>
		<div class="form-wrapper">
			<!-- Closable error message to clear the view and avoid overlap with other elements -->
			<Message
				v-if="showValidationError"
				severity="error"
				class="form-error-message"
				:closable="true"
				@close="errorBannerDismissed = true"
			>
				<IconSVG name="mdiAlertCircleOutline" variant="error" />
				<ul class="form-error-text-wrap">
					<li v-if="validationErrorMessage?.length">
						{{ validationErrorMessage }}
					</li>
					<li v-if="geolocationErrorMessage?.length">
						{{ geolocationErrorMessage }}
					</li>
				</ul>
				<Button
					v-if="validationErrorMessage?.length"
					link
					class="view-error-button"
					@click="navigateToFirstViolation"
				>
					<strong>{{ t('odk_web_forms.validation.view.label') }}</strong>
				</Button>
			</Message>

			<FormHeader :form="state.root" @change-language="setLanguage" />

			<Card class="questions-card">
				<template #content>
					<div class="form-questions">
						<div class="flex flex-column gap-2">
							<QuestionList :nodes="state.root.currentState.children" />
						</div>
					</div>
				</template>
			</Card>

			<FormFooter :root="state.root" @submit="handleSubmit(state)" @next="handleNext(state)" />
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
		padding-top: var(--odk-spacing-m);

		.questions-card {
			border-radius: var(--odk-radius);
			box-shadow: none;
			border-top: none;
			margin-top: var(--odk-spacing-xl);
		}

		.questions-card > :deep(.p-card-body) {
			padding: 2rem;
		}

		.form-error-message.p-message.p-message-error {
			position: sticky;
			z-index: var(--odk-z-index-error-banner);
			border-radius: var(--odk-radius);
			background-color: var(--odk-error-background-color);
			border: 1px solid var(--p-message-error-border-color);
			outline: none;
			max-width: var(--odk-max-form-width);
			width: 100%;
			margin: 0 auto;
			top: 1rem;

			:deep(.p-message-wrapper) {
				padding: 8px var(--odk-spacing-l);
				flex-grow: 1;
			}

			:deep(.p-message-text) {
				display: flex;
				align-items: center;
				font-weight: 400;
				flex: 1;
			}

			.odk-icon {
				margin-right: var(--odk-spacing-m);
			}

			.form-error-text-wrap {
				margin: 0;
				list-style: none;
				padding: 0;

				li:not(:last-child) {
					margin-bottom: var(--odk-spacing-m);
				}
			}

			.view-error-button {
				margin-left: auto;
				min-width: 0;
				color: inherit;
				text-align: right;
			}
		}
	}

	:deep(.p-button) {
		min-height: 40px;
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
			margin-top: var(--odk-spacing-s);
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

			.form-error-message.p-message.p-message-error {
				margin: 1rem 1rem 0 1rem;
				max-width: unset;
				width: calc(100% - 2rem);
				order: 2;
			}

			.questions-card {
				border-radius: unset;
				box-shadow: unset;
				margin-top: 0;
				order: 3;
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
@use '../assets/styles/primevue';

:root {
	// This variable is used to assert the breakpoint from PrimeFlex are loaded
	// {@link https://github.com/getodk/web-forms/blob/main/packages/web-forms/e2e/test-cases/build/style.test.ts}
	--odk-test-breakpoint-lg: #{pf.$lg};
}
</style>
