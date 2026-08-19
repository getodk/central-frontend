import {
  ODK_ENCRYPTED_NAMESPACE_URI,
  OPENROSA_XFORMS_NAMESPACE_URI,
} from '@getodk/common/constants/xmlns.ts';
import {
  ENCRYPTED_SUBMISSION_ATTACHMENT_NAME,
  ENCRYPTED_SUFFIX,
} from '../../lib/client-reactivity/instance-state/quarantine/encryption';

export class EncryptedSubmissionManifestDefinition {
  readonly attachments: string[];

  constructor(
    readonly formId: string,
    readonly formVersion: string | undefined,
    readonly instanceId: string,
    readonly encryptedSymmetricKey: string,
    attachments: readonly File[]
  ) {
    this.attachments = attachments.map((attachment) => attachment.name + ENCRYPTED_SUFFIX);
  }

  serialize(): string {
    const manifest = document.createElementNS(ODK_ENCRYPTED_NAMESPACE_URI, 'data');
    manifest.setAttribute('encrypted', 'yes');
    manifest.setAttribute('id', this.formId);
    if (this.formVersion) {
      manifest.setAttribute('version', this.formVersion);
    }

    const keyEl = document.createElementNS(ODK_ENCRYPTED_NAMESPACE_URI, 'base64EncryptedKey');
    keyEl.textContent = this.encryptedSymmetricKey;
    manifest.appendChild(keyEl);

    const xmlFileEl = document.createElementNS(ODK_ENCRYPTED_NAMESPACE_URI, 'encryptedXmlFile');
    xmlFileEl.textContent = ENCRYPTED_SUBMISSION_ATTACHMENT_NAME;
    manifest.appendChild(xmlFileEl);

    for (const attachment of this.attachments) {
      const mediaEl = document.createElementNS(ODK_ENCRYPTED_NAMESPACE_URI, 'media');
      const fileEl = document.createElementNS(ODK_ENCRYPTED_NAMESPACE_URI, 'file');
      fileEl.textContent = attachment;
      mediaEl.appendChild(fileEl);
      manifest.appendChild(mediaEl);
    }

    const metaEl = document.createElementNS(OPENROSA_XFORMS_NAMESPACE_URI, 'meta');
    const instanceIDEl = document.createElementNS(OPENROSA_XFORMS_NAMESPACE_URI, 'instanceID');
    instanceIDEl.textContent = this.instanceId;
    metaEl.appendChild(instanceIDEl);
    manifest.appendChild(metaEl);

    return new XMLSerializer().serializeToString(manifest);
  }
}
