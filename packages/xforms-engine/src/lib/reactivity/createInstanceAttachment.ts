import { batch, createComputed, createSignal, untrack, type Accessor, type Setter } from 'solid-js';
import { AttachmentNotFoundError } from '../../error/AttachmentNotFoundError.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { InstanceAttachmentFileName } from '../../instance/attachments/InstanceAttachment.ts';
import { InstanceAttachment } from '../../instance/attachments/InstanceAttachment.ts';
import type { InstanceAttachmentContext } from '../../instance/internal-api/InstanceAttachmentContext.ts';
import type { SimpleAtomicState, SimpleAtomicStateSetter } from './types.ts';

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

export type AttachmentLoadingError = 'network-error' | 'not-found';

export interface BaseInstanceAttachmentState {
  readonly computedName: string | null;
  readonly intrinsicName: string | null;
  readonly file: InstanceAttachmentRuntimeValue;
  readonly loading: boolean;
  readonly loadingError: AttachmentLoadingError | false;
  readonly dirty: boolean;
}

// The file the client last wrote, so the resolver can map the node's value back to it.
interface ClientWrite {
  readonly computedName: string | null;
  readonly intrinsicName: string | null;
  readonly file: InstanceAttachmentRuntimeValue;
}

const clientWriteName = (write: ClientWrite): InstanceAttachmentFileName => {
  return write.computedName ?? write.intrinsicName ?? '';
};

const BLANK_STATE: BaseInstanceAttachmentState = {
  computedName: null,
  intrinsicName: null,
  file: null,
  loading: false,
  loadingError: false,
  dirty: false,
};

const clientWriteState = (write: ClientWrite): BaseInstanceAttachmentState => {
  return {
    ...BLANK_STATE,
    computedName: write.computedName,
    intrinsicName: write.intrinsicName,
    file: write.file,
    dirty: true,
  };
};

const loadingState = (reference: string): BaseInstanceAttachmentState => {
  return { ...BLANK_STATE, intrinsicName: reference, loading: true };
};

const resolvedState = (file: File): BaseInstanceAttachmentState => {
  return { ...BLANK_STATE, intrinsicName: file.name, file };
};

const loadingErrorState = (
  reference: string,
  error: AttachmentLoadingError
): BaseInstanceAttachmentState => {
  return { ...BLANK_STATE, intrinsicName: reference, loadingError: error };
};

const createClientWrite = (context: InstanceAttachmentContext, file: File): ClientWrite => {
  const { basename, extension } = splitFileName(file.name);
  const computedName = context.instanceConfig.computeAttachmentName({
    nodeId: context.nodeId,
    writtenAt: new Date(),
    basename,
    extension,
  });

  if (computedName == null) {
    return { computedName, intrinsicName: file.name, file };
  }

  return {
    computedName,
    intrinsicName: file.name,
    file: new File([file], computedName, { type: file.type }),
  };
};

const toLoadingError = (error: unknown): AttachmentLoadingError => {
  return error instanceof AttachmentNotFoundError ? 'not-found' : 'network-error';
};

interface ReferenceResolver {
  readonly context: InstanceAttachmentContext;
  readonly getInstanceValue: Accessor<InstanceAttachmentFileName>;
  readonly getClientWrite: Accessor<ClientWrite | null>;
  readonly setState: Setter<BaseInstanceAttachmentState>;
}

// The instance value may change while a file is loading; only the latest wins.
const isCurrentReference = (resolver: ReferenceResolver, reference: string) => {
  return untrack(() => {
    if (resolver.getInstanceValue() !== reference) {
      return false;
    }

    const clientWrite = resolver.getClientWrite();
    if (clientWrite == null) {
      return true;
    }

    return clientWriteName(clientWrite) !== reference;
  });
};

const applyResolvedFile = (
  resolver: ReferenceResolver,
  reference: string,
  filePromise: Promise<File>
) => {
  void filePromise
    .then((file) => resolvedState(file))
    .catch((error: unknown) => loadingErrorState(reference, toLoadingError(error)))
    .then((state) => {
      if (isCurrentReference(resolver, reference)) {
        resolver.setState(state);
      }
    });
};

const resolveReference = (
  resolver: ReferenceResolver,
  reference: string,
  clientWrite: ClientWrite | null
): BaseInstanceAttachmentState => {
  if (clientWrite != null && clientWriteName(clientWrite) === reference) {
    return clientWriteState(clientWrite);
  }

  if (reference === '') {
    return BLANK_STATE;
  }

  const filePromise = resolver.context.rootDocument.attachments.resolveFile(reference);
  if (filePromise == null) {
    return { ...BLANK_STATE, intrinsicName: reference };
  }

  applyResolvedFile(resolver, reference, filePromise);

  return loadingState(reference);
};

export const createInstanceAttachment = (
  context: InstanceAttachmentContext,
  instanceValueState: SimpleAtomicState<InstanceAttachmentFileName>
): InstanceAttachment => {
  return context.scope.runTask(() => {
    const [getInstanceValue, setInstanceValue] = instanceValueState;
    const [getState, setState] = createSignal<BaseInstanceAttachmentState>(BLANK_STATE);
    const [getClientWrite, setClientWrite] = createSignal<ClientWrite | null>(null);
    const resolver: ReferenceResolver = { context, getInstanceValue, getClientWrite, setState };

    createComputed(() => {
      const reference = getInstanceValue();
      const clientWrite = getClientWrite();
      untrack(() => setState(resolveReference(resolver, reference, clientWrite)));
    });

    const getValue: Accessor<InstanceAttachmentRuntimeValue> = () => getState().file;

    const setValue: SimpleAtomicStateSetter<InstanceAttachmentRuntimeValue> = (value) => {
      const write = value == null ? null : createClientWrite(context, value);
      const instanceValue = write == null ? '' : clientWriteName(write);

      batch(() => {
        setInstanceValue(instanceValue);
        setClientWrite(write);
      });

      return getValue();
    };

    const retry = () => {
      if (getState().loading) {
        return;
      }

      const reference = untrack(() => getInstanceValue());
      const clientWrite = untrack(() => getClientWrite());

      context.rootDocument.attachments.retryFile(reference);

      const state = resolveReference(resolver, reference, clientWrite);
      setState(state);
    };

    return InstanceAttachment.init(context, {
      getValue,
      setValue,
      valueState: [getValue, setValue],
      getState,
      retry,
    });
  });
};
