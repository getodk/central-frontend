import type { InstanceAttachmentsState } from '../../../instance/attachments/InstanceAttachmentsState';

export const collectInstanceAttachmentFiles = (
  attachments: InstanceAttachmentsState,
  dirtyOnly = true
): readonly File[] => {
  const files = Array.from(attachments.entries()).map(([context, attachment]) => {
    if (!context.isAttached() || !context.isRelevant()) {
      return null;
    }

    const state = attachment.getState();
    if (dirtyOnly && !state.dirty) {
      // File not set by client. During editing this means it's unchanged and we don't need to upload it again.
      return null;
    }

    return attachment.getValue();
  });

  return files.filter((file) => file != null);
};
