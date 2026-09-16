import type { Accessor } from 'solid-js';
import type { InstancePayload } from '../../client/index.ts';
import type { BaseInstanceAttachmentState } from '../../lib/reactivity/createInstanceAttachment.ts';
import type { SimpleAtomicState, SimpleAtomicStateSetter } from '../../lib/reactivity/types.ts';
import type { InstanceAttachmentContext } from '../internal-api/InstanceAttachmentContext.ts';
import type { InstanceAttachmentsState } from './InstanceAttachmentsState.ts';

export type InstanceAttachmentFileName = string;
export type InstanceAttachmentRuntimeValue = File | null;

export interface InstanceAttachmentOptions {
  readonly getValue: Accessor<InstanceAttachmentRuntimeValue>;
  readonly setValue: SimpleAtomicStateSetter<InstanceAttachmentRuntimeValue>;
  readonly valueState: SimpleAtomicState<InstanceAttachmentRuntimeValue>;

  readonly getState: Accessor<BaseInstanceAttachmentState>;

  readonly retry: () => void;
}

export class InstanceAttachment {
  /**
   * 1. Creates {@link InstanceAttachment | attachment state} from
   *    {@link InstanceAttachmentOptions}
   * 2. Registers that attachment state in an instance-global
   *    {@link InstanceAttachmentsState} entry
   *
   * This allows an instance to:
   *
   * - Produce distinct file names for each attachment
   * - Track all attachments so they can be serialized in an
   *   {@link InstancePayload}
   */
  static init(
    context: InstanceAttachmentContext,
    options: InstanceAttachmentOptions
  ): InstanceAttachment {
    const attachment = new this(options);
    const { attachments } = context.rootDocument;

    attachments.set(context, attachment);

    return attachment;
  }

  /**
   * This property isn't used at runtime. It causes TypeScript to treat
   * {@link InstanceAttachment} as a nominal type, ensuring
   * {@link InstanceAttachment.init} is called to instantiate it.
   */
  protected readonly _ = null;

  readonly getValue: Accessor<InstanceAttachmentRuntimeValue>;
  readonly setValue: SimpleAtomicStateSetter<InstanceAttachmentRuntimeValue>;
  readonly valueState: SimpleAtomicState<InstanceAttachmentRuntimeValue>;

  readonly getState: Accessor<BaseInstanceAttachmentState>;

  readonly retry: () => void;

  private constructor(options: InstanceAttachmentOptions) {
    this.getValue = options.getValue;
    this.setValue = options.setValue;
    this.valueState = options.valueState;
    this.getState = options.getState;
    this.retry = options.retry;
  }
}
