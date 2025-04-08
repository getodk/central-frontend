import { createMemo, createSignal } from 'solid-js';
import type { FormNodeID } from '../../client/identity.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { InstanceAttachmentFileName } from '../../instance/attachments/InstanceAttachment.ts';
import { InstanceAttachment } from '../../instance/attachments/InstanceAttachment.ts';
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
	readonly nodeId: FormNodeID;
	readonly writtenAt: Date | null;
	readonly file: InstanceAttachmentRuntimeValue;
}

interface BaseInstanceAttachmentState {
	readonly computedName: string | null;
	readonly intrinsicName: string | null;
	readonly file: InstanceAttachmentRuntimeValue;
}

interface BlankInstanceAttachmentState extends BaseInstanceAttachmentState {
	readonly computedName: null;
	readonly intrinsicName: null;
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
	const { nodeId, file, writtenAt } = options;

	// No file -> no intrinsic name, no name to compute
	if (file == null) {
		return {
			computedName: null,
			intrinsicName: null,
			file: null,
		};
	}

	const intrinsicName = file.name;

	// File exists, not written by client -> preserve instance input name
	if (writtenAt == null) {
		return {
			computedName: null,
			intrinsicName,
			file,
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
	};
};

export const createInstanceAttachment = (
	context: InstanceAttachmentContext
): InstanceAttachment => {
	return context.scope.runTask(() => {
		const { rootDocument, nodeId } = context;
		const { attachments } = rootDocument;
		const file = attachments.getInitialFileValue(context.instanceNode);
		const initialState = instanceAttachmentState(context, {
			nodeId,
			file,
			writtenAt: null,
		});

		const [getState, setState] = createSignal<InstanceAttachmentState>(initialState);

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
			const updatedState = instanceAttachmentState(context, {
				nodeId,
				file: value,
				writtenAt: new Date(),
			});

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
		});
	});
};
