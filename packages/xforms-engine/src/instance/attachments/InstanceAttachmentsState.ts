import {
  JRResourceURL,
  type JRResourceURLString,
} from '@getodk/common/jr-resources/JRResourceURL.ts';
import { getBlobData } from '@getodk/common/lib/web-compat/blob.ts';
import type { FetchFormAttachment } from '../../client/resources.ts';
import { AttachmentNotFoundError } from '../../error/AttachmentNotFoundError.ts';
import type { InstanceAttachmentMap } from '../input/InstanceAttachmentMap.ts';
import type { InstanceAttachmentContext } from '../internal-api/InstanceAttachmentContext.ts';
import type { InstanceAttachment } from './InstanceAttachment.ts';

export class InstanceAttachmentsState extends Map<InstanceAttachmentContext, InstanceAttachment> {
  private readonly formAttachmentFiles = new Map<JRResourceURLString, Promise<File>>();

  constructor(
    private readonly sourceAttachments: InstanceAttachmentMap | null = null,
    private readonly fetchFormAttachment: FetchFormAttachment | null = null
  ) {
    super();
  }

  private async fetchFormAttachmentFile(
    fetchFormAttachment: FetchFormAttachment,
    value: JRResourceURLString
  ): Promise<File> {
    const response = await fetchFormAttachment(JRResourceURL.from(value));
    if (!response.ok) {
      throw new Error(`Error fetching form attachment: ${value}`);
    }

    const blob = await response.blob();
    const blobData = await getBlobData(blob);
    return new File([blobData], value, { type: blob.type });
  }

  private resolveFormAttachmentFile(value: JRResourceURLString): Promise<File> | null {
    if (this.fetchFormAttachment == null) {
      return null;
    }

    const cached = this.formAttachmentFiles.get(value);
    if (cached != null) {
      return cached;
    }

    const file = this.fetchFormAttachmentFile(this.fetchFormAttachment, value);
    this.formAttachmentFiles.set(value, file);
    return file;
  }

  // Resolves a binary node's value to an attachment of the edited instance or a
  // `jr://` form attachment; `null` when nothing can be resolved without error.
  resolveFile(reference: string): Promise<File> | null {
    const value = reference.trim();
    if (!value.length) {
      return null;
    }

    const sourceFile = this.sourceAttachments?.get(value) ?? null;
    if (sourceFile != null) {
      return sourceFile;
    }

    if (JRResourceURL.isJRResourceReference(value)) {
      return this.resolveFormAttachmentFile(value);
    }

    return Promise.reject(new AttachmentNotFoundError(value));
  }

  retryFile(reference: string) {
    const value = reference.trim();
    if (JRResourceURL.isJRResourceReference(value)) {
      this.formAttachmentFiles.delete(value);
    }
    this.sourceAttachments?.retry(value);
  }
}
