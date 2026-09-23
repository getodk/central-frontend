import { identity } from '@getodk/common/lib/identity.ts';
import { ErrorProductionDesignPendingError } from '../../error/ErrorProductionDesignPendingError.ts';
import type { InstanceAttachmentRuntimeValue } from '../../instance/attachments/InstanceAttachment.ts';
import type { InstanceAttachmentContext } from '../../instance/internal-api/InstanceAttachmentContext.ts';
import type { InstanceValueContext } from '../../instance/internal-api/InstanceValueContext.ts';
import { createInstanceAttachment } from '../reactivity/createInstanceAttachment.ts';
import { type CreateRuntimeValueState, ValueCodec } from './ValueCodec.ts';

type UploadContext = InstanceAttachmentContext & InstanceValueContext;

const createUploadValueState: CreateRuntimeValueState<
  InstanceAttachmentRuntimeValue,
  InstanceAttachmentRuntimeValue,
  UploadContext
> = (instanceState, context) => {
  return createInstanceAttachment(context, instanceState).valueState;
};

// The runtime value is a `File` resolved asynchronously by `createInstanceAttachment`,
// so the sync encoder and decoder that `ValueCodec` requires are never used.
export class UploadCodec extends ValueCodec<
  'binary',
  InstanceAttachmentRuntimeValue,
  InstanceAttachmentRuntimeValue,
  UploadContext
> {
  constructor() {
    super(
      'binary',
      (file) => file?.name ?? '',
      (value) => {
        throw new ErrorProductionDesignPendingError(
          `Cannot decode attachment "${value}" synchronously`
        );
      },
      {
        decodeInstanceValueFactory: () => identity,
        runtimeValueStateFactory: () => createUploadValueState,
      }
    );
  }
}
