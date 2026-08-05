export class AttachmentNotFoundError extends Error {
  constructor(fileName: string) {
    super(`Attachment not found: ${fileName}`);
  }
}
