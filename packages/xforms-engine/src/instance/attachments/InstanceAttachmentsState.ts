import {
  JRResourceURL,
  type JRResourceURLString,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import type { FetchFormAttachment } from '../../client/resources.ts';
import { AttachmentNotFoundError } from '../../error/AttachmentNotFoundError.ts';
import type { StaticLeafElement } from '../../integration/xpath/static-dom/StaticElement.ts';
import type { InstanceAttachmentMap } from '../input/InstanceAttachmentMap.ts';
import type { InstanceAttachmentContext } from '../internal-api/InstanceAttachmentContext.ts';
import type { InstanceAttachment } from './InstanceAttachment.ts';

export class InstanceAttachmentsState extends Map<InstanceAttachmentContext, InstanceAttachment> {
  constructor(
    private readonly sourceAttachments: InstanceAttachmentMap | null = null,
    private readonly fetchFormAttachment: FetchFormAttachment | null = null
  ) {
    super();
  }

  private async resolveFormAttachmentFile(
    fetchFormAttachment: FetchFormAttachment,
    value: JRResourceURLString
  ): Promise<File> {
    const response = await fetchFormAttachment(JRResourceURL.from(value));
    if (!response.ok) {
      throw new Error(`Error fetching form attachment: ${value}`);
    }

    const blob = await response.blob();
    return new File([blob], value, { type: blob.type });
  }

  getInitialFileValue(instanceNode: StaticLeafElement | null): Promise<File> | null {
    if (!instanceNode?.value?.length) {
      return null;
    }

    const value = instanceNode.value.trim();
    const sourceFile = this.sourceAttachments?.get(value) ?? null;
    if (sourceFile != null) {
      return sourceFile;
    }

    // Resolve jr:// default values (e.g. annotate with a default image) so the attachment state
    // and submission payload are updated and valid.
    if (JRResourceURL.isJRResourceReference(value)) {
      return this.fetchFormAttachment
        ? this.resolveFormAttachmentFile(this.fetchFormAttachment, value)
        : null;
    }

    return Promise.reject(new AttachmentNotFoundError(value));
  }

  retryFileValue(instanceNode: StaticLeafElement | null) {
    if (instanceNode !== null) {
      this.sourceAttachments?.retry(instanceNode.value.trim());
    }
  }
}
