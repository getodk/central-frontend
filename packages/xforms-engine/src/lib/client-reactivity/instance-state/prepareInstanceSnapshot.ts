import type { InstanceSnapshot } from '../../../client/serialization/InstancePayload.ts';
import type { ClientReactiveSerializableInstance } from '../../../instance/internal-api/serialization/ClientReactiveSerializableInstance.ts';
import { collectInstanceAttachmentFiles } from './prepareAttachmentPayload.ts';

export const prepareInstanceSnapshot = (
  instanceRoot: ClientReactiveSerializableInstance
): InstanceSnapshot => {
  const xml = instanceRoot.instanceState.instanceXML;
  const attachments = collectInstanceAttachmentFiles(instanceRoot.attachments, false);
  return {
    xml,
    attachments,
  };
};
