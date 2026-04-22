import { createMemo, createSignal, type Setter } from 'solid-js';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { InstanceAttachmentFileName } from '../../instance/attachments/InstanceAttachment.ts';
import { InstanceAttachment } from '../../instance/attachments/InstanceAttachment.ts';
import type { InstanceAttachmentsState } from '../../instance/attachments/InstanceAttachmentsState.ts';
import type { InstanceAttachmentContext } from '../../instance/internal-api/InstanceAttachmentContext.ts';
import type { DecodeInstanceValue } from '../../instance/internal-api/InstanceValueContext.ts';
import type { SimpleAtomicStateSetter } from './types.ts';

type FileNameExtension = `.${string}`;

type AssertFileNameExtension = (value: string) => asserts value is FileNameExtension;

const assertFileNameExtension: AssertFileNameExtension = (value) => {
	if (!value.startsWith('.')) {
		throw new ErrorProductionDesignPendingError('Expected file name extension to start with "."');
	}
};

interface SplitFileNameResult {
	readonly basename: string;
	readonly extension: FileNameExtension | null;
}

const EXTENSION_PATTERN = /\.[^.]+?$/;

interface SearchPatternResult extends Array<string> {
	readonly 0?: string;
	readonly index?: number;
}

const searchPattern = (pattern: RegExp, string: string): SearchPatternResult => {
	return pattern.exec(string) ?? [];
};

const splitFileName = (fileName: string): SplitFileNameResult => {
	const extensionMatches = searchPattern(EXTENSION_PATTERN, fileName);
	const [extension = null] = extensionMatches;
	const basename = fileName.slice(0, extensionMatches.index);

	if (extension == null) {
		return {
			basename,
			extension,
		};
	}

	assertFileNameExtension(extension);

	return {
		basename,
		extension,
	};
};

export type InstanceAttachmentRuntimeValue = File | null;

export type InstanceAttachmentFormDataEntry = readonly [
	key: InstanceAttachmentFileName,
	value: NonNullable<InstanceAttachmentRuntimeValue>,
];

interface InstanceAttachmentValueOptions {
	readonly writtenAt?: Date;
	readonly file?: InstanceAttachmentRuntimeValue;
	readonly loading?: boolean;
	readonly error?: boolean;
}

export interface BaseInstanceAttachmentState {
	readonly computedName: string | null;
	readonly intrinsicName: string | null;
	readonly file: InstanceAttachmentRuntimeValue;
	readonly loading: boolean;
	readonly loadingError: boolean;
	readonly dirty: boolean;
}

interface BlankInstanceAttachmentState extends BaseInstanceAttachmentState {
	readonly computedName: null;
	readonly intrinsicName: string | null;
	readonly file: null;
}

interface NonBlankInstanceAttachmentState extends BaseInstanceAttachmentState {
	readonly computedName: string | null;
	readonly intrinsicName: string;
	readonly file: NonNullable<InstanceAttachmentRuntimeValue>;
}

// prettier-ignore
type InstanceAttachmentState =
	| BlankInstanceAttachmentState
	| NonBlankInstanceAttachmentState;

const instanceAttachmentState = (
	context: InstanceAttachmentContext,
	options: InstanceAttachmentValueOptions
): InstanceAttachmentState => {
	const { nodeId } = context;
	const existingName = context.instanceNode?.value ?? null;
	const { file, writtenAt, loading, error } = options;

	// No file -> no intrinsic name, no name to compute
	if (file == null) {
		return {
			computedName: null,
			intrinsicName: existingName,
			file: null,
			loading: !!loading,
			loadingError: error ?? false,
			dirty: false,
		};
	}

	// File exists, not written by client -> preserve instance input name
	const intrinsicName = file.name;
	if (writtenAt == null) {
		return {
			computedName: null,
			intrinsicName,
			file,
			loading: !!loading,
			loadingError: false,
			dirty: false,
		};
	}

	// File was written by client, name is computed as configured by client
	const { basename, extension } = splitFileName(intrinsicName);
	const computedName = context.instanceConfig.computeAttachmentName({
		nodeId,
		writtenAt,
		basename,
		extension,
	});

	return {
		computedName,
		intrinsicName,
		file,
		loading: !!loading,
		loadingError: false,
		dirty: true,
	};
};

const resolveFile = (
	context: InstanceAttachmentContext,
	setState: Setter<InstanceAttachmentState>,
	filePromise: Promise<File>
) => {
	filePromise
		.then((file: File) => {
			setState(instanceAttachmentState(context, { file }));
		})
		.catch((_) => {
			setState(instanceAttachmentState(context, { error: true }));
		});
};

const retryFetch = (
	context: InstanceAttachmentContext,
	attachments: InstanceAttachmentsState,
	setState: Setter<InstanceAttachmentState>
) => {
	setState(instanceAttachmentState(context, { loading: true }));
	attachments.retryFileValue(context.instanceNode);
	const filePromise = attachments.getInitialFileValue(context.instanceNode);
	if (filePromise) {
		resolveFile(context, setState, filePromise);
	}
};

export const createInstanceAttachment = (
	context: InstanceAttachmentContext
): InstanceAttachment => {
	return context.scope.runTask(() => {
		const { rootDocument } = context;
		const { attachments } = rootDocument;

		const initialValue = attachments.getInitialFileValue(context.instanceNode);
		const initialState = instanceAttachmentState(context, { loading: !!initialValue });

		const [getState, setState] = createSignal<InstanceAttachmentState>(initialState);

		const retry = () => {
			if (getState().loading) {
				// already loading - debounce the retry
				return;
			}
			retryFetch(context, attachments, setState);
		};

		if (initialValue) {
			resolveFile(context, setState, initialValue);
		}

		const decodeInstanceValue: DecodeInstanceValue = (value) => {
			const { computedName, intrinsicName } = getState();

			if (value === '') {
				if (computedName != null || intrinsicName != null) {
					throw new ErrorProductionDesignPendingError(
						`Unexpected file name reference. Expected one of "${computedName}", "${intrinsicName}", got: ""`
					);
				}
			}

			if (value === intrinsicName) {
				return computedName ?? intrinsicName;
			}

			if (value === computedName) {
				return computedName;
			}

			throw new ErrorProductionDesignPendingError(
				`Unexpected file name reference. Expected one of "${computedName}", "${intrinsicName}", got: "${value}"`
			);
		};

		const getValue = createMemo(() => {
			const { computedName, file: currentFile } = getState();

			if (computedName == null) {
				return currentFile;
			}

			return new File([currentFile], computedName, {
				type: currentFile.type,
			});
		});
		const setValue: SimpleAtomicStateSetter<InstanceAttachmentRuntimeValue> = (value) => {
			const updatedState = instanceAttachmentState(context, { file: value, writtenAt: new Date() });
			return setState(updatedState).file;
		};
		const valueState = [getValue, setValue] as const;

		const getFileName = createMemo(() => {
			const { computedName, intrinsicName } = getState();

			return computedName ?? intrinsicName;
		});
		const getInstanceValue = createMemo(() => getFileName() ?? '');

		return InstanceAttachment.init(context, {
			getFileName,
			getInstanceValue,
			decodeInstanceValue,

			getValue,
			setValue,
			valueState,

			getState,

			retry,
		});
	});
};
