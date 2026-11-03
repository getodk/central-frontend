import { describe, expect, it, vi } from 'vitest';
import type { FetchFormAttachment, FetchResourceResponse } from '../../../src/client/resources';
import { AttachmentNotFoundError } from '../../../src/error/AttachmentNotFoundError';
import { InstanceAttachmentsState } from '../../../src/instance/attachments/InstanceAttachmentsState';
import type { InstanceAttachmentMap } from '../../../src/instance/input/InstanceAttachmentMap';

describe('InstanceAttachmentsState', () => {
  const okResponse = (blob: Blob): FetchResourceResponse => ({
    ok: true,
    blob: () => Promise.resolve(blob),
    text: () => Promise.resolve(''),
  });

  const errorResponse = (): FetchResourceResponse => ({
    ok: false,
    blob: () => Promise.resolve(new Blob()),
    text: () => Promise.resolve(''),
  });

  describe('resolveFile', () => {
    it('returns null when the reference is empty', () => {
      const fetchFormAttachment = vi.fn<FetchFormAttachment>();
      const state = new InstanceAttachmentsState(null, fetchFormAttachment);

      expect(state.resolveFile('')).toBeNull();
      expect(fetchFormAttachment).not.toHaveBeenCalled();
    });

    it('returns the source attachment for a trimmed reference and skips fetching', () => {
      const sourceFile = Promise.resolve(new File([''], 'photo.png', { type: 'image/png' }));
      // @ts-expect-error - a plain Map is enough for the lookup this test needs
      const sourceAttachments: InstanceAttachmentMap = new Map([['photo.png', sourceFile]]);
      const fetchFormAttachment = vi.fn<FetchFormAttachment>();
      const state = new InstanceAttachmentsState(sourceAttachments, fetchFormAttachment);

      const result = state.resolveFile(`photo.png\n        `);

      expect(result).toBe(sourceFile);
      expect(fetchFormAttachment).not.toHaveBeenCalled();
    });

    it('fetches a jr:// URL and builds a File from the response', async () => {
      const blob = new Blob(['data'], { type: 'image/png' });
      const fetchFormAttachment = vi.fn<FetchFormAttachment>().mockResolvedValue(okResponse(blob));
      const state = new InstanceAttachmentsState(null, fetchFormAttachment);

      const result = await state.resolveFile('jr://images/default.png');

      expect(result).toBeInstanceOf(File);
      expect(result?.name).toBe('jr://images/default.png');
      expect(result?.type).toBe('image/png');
      expect(fetchFormAttachment).toHaveBeenCalledTimes(1);
      expect(fetchFormAttachment.mock.calls[0]?.[0].href).toBe('jr://images/default.png');
    });

    it('rejects when fetchFormAttachment returns a non-ok response', async () => {
      const fetchFormAttachment = vi.fn<FetchFormAttachment>().mockResolvedValue(errorResponse());
      const state = new InstanceAttachmentsState(null, fetchFormAttachment);

      await expect(state.resolveFile('jr://images/missing.png')).rejects.toThrow(
        'Error fetching form attachment: jr://images/missing.png'
      );
    });

    it('rejects when the reference is not a jr:// URL and has no source attachment', async () => {
      const fetchFormAttachment = vi.fn<FetchFormAttachment>();
      const state = new InstanceAttachmentsState(null, fetchFormAttachment);

      await expect(state.resolveFile('plain-value.txt')).rejects.toThrow(AttachmentNotFoundError);
      expect(fetchFormAttachment).not.toHaveBeenCalled();
    });

    it('returns null when the reference is a jr:// URL but no fetchFormAttachment was provided', () => {
      const state = new InstanceAttachmentsState();

      expect(state.resolveFile('jr://images/default.png')).toBeNull();
    });
  });

  describe('retryFile', () => {
    it('retries the source attachment', () => {
      const retry = vi.fn();
      // @ts-expect-error - stub with just the properties this test calls
      const sourceAttachments: InstanceAttachmentMap = { get: () => null, retry };
      const state = new InstanceAttachmentsState(sourceAttachments);

      state.retryFile(' photo.png ');

      expect(retry).toHaveBeenCalledWith('photo.png');
    });
  });
});
