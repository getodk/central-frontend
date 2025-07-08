import type { Awaitable } from '@getodk/common/types/helpers.js';
import type { POST_SUBMIT__NEW_INSTANCE } from '../constants/control-flow.ts';

export interface HostSubmissionResult {
	readonly next?: POST_SUBMIT__NEW_INSTANCE;
}

export type OptionalHostSubmissionResult = HostSubmissionResult | null | void;

export type OptionalAwaitableHostSubmissionResult = Awaitable<OptionalHostSubmissionResult>;

export type HostSubmissionResultCallback = (
	// Everything is optional!
	hostResult?: OptionalAwaitableHostSubmissionResult
) => void;
