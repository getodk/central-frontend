import type { Ref } from 'vue';
import { ref } from 'vue';
import type { FormState, FormStateLoadingResult } from './FormState.ts';

/**
 * If this seems silly: Yes. Absolutely. It is totally silly!
 *
 * This is a workaround for the much more obvious thing that doesn't work:
 *
 * ```ts
 * const state = ref<FormState>({
 *  ...LITERALLY_ANY_VALUE_AT_ALL,
 * });
 * ```
 *
 * Why doesn't that work? Vue's own types? Some Vue-related tooling? Who knows!
 *
 * Whatever the cause, when combining...
 *
 * - an explicit `FormState` type parameter
 * - an explicit default value
 *
 * ... the ref's `value` is:
 *
 * - Not nullish. (Good! That's why we pass a default value!)
 * - Not assignable **to or from** `FormState` (Bad! That's why we would pass an
 *   explicit type parameter!)
 */
export const initializeFormState = (): Ref<FormState> => {
	return ref({
		status: 'FORM_STATE_LOADING',
		error: null,
		form: null,
		instance: null,
		root: null,
	} satisfies FormStateLoadingResult);
};
