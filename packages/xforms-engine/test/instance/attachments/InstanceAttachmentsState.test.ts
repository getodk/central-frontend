import { describe, expect, it, vi } from 'vitest';
import type { FetchFormAttachment, FetchResourceResponse } from '../../../src/client/resources';
import { AttachmentNotFoundError } from '../../../src/error/AttachmentNotFoundError';
import { InstanceAttachmentsState } from '../../../src/instance/attachments/InstanceAttachmentsState';
import type { InstanceAttachmentMap } from '../../../src/instance/input/InstanceAttachmentMap';
import type { StaticLeafElement } from '../../../src/integration/xpath/static-dom/StaticElement';

describe('InstanceAttachmentsState', () => {
  const leafWithValue = (value: string): StaticLeafElement => {
    return { value } as unknown as StaticLeafElement;
  };

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

  describe('getInitialFileValue', () => {
    it('returns null when the instance node is null', () => {
      const state = new InstanceAttachmentsState();

      expect(state.getInitialFileValue(null)).toBeNull();
    });

    it('returns the source attachment when present and skips fetching', () => {
      const sourceFile = Promise.resolve(new File(['hello'], 'source.txt'));
      const sourceAttachments = new Map([
        ['source.txt', sourceFile],
      ]) as unknown as InstanceAttachmentMap;
      const fetchFormAttachment = vi.fn<FetchFormAttachment>();
      const state = new InstanceAttachmentsState(sourceAttachments, fetchFormAttachment);

      const result = state.getInitialFileValue(leafWithValue('source.txt'));

      expect(result).toBe(sourceFile);
      expect(fetchFormAttachment).not.toHaveBeenCalled();
    });

    it('fetches the form attachment when value is a jr:// reference and no source attachment exists', async () => {
      const blob = new Blob(['data'], { type: 'image/png' });
      const fetchFormAttachment = vi.fn<FetchFormAttachment>().mockResolvedValue(okResponse(blob));
      const state = new InstanceAttachmentsState(null, fetchFormAttachment);

      const result = await state.getInitialFileValue(leafWithValue('jr://images/default.png'));

      expect(result).toBeInstanceOf(File);
      expect(result?.name).toBe('jr://images/default.png');
      expect(result?.type).toBe('image/png');
      expect(fetchFormAttachment).toHaveBeenCalledTimes(1);
      expect(fetchFormAttachment.mock.calls[0]?.[0].href).toBe('jr://images/default.png');
    });

    it('rejects when fetchFormAttachment returns a non-ok response', async () => {
      const fetchFormAttachment = vi.fn<FetchFormAttachment>().mockResolvedValue(errorResponse());
      const state = new InstanceAttachmentsState(null, fetchFormAttachment);

      await expect(
        state.getInitialFileValue(leafWithValue('jr://images/missing.png'))
      ).rejects.toThrow('Error fetching form attachment: jr://images/missing.png');
    });

    it('returns null when value is empty', () => {
      const fetchFormAttachment = vi.fn<FetchFormAttachment>();
      const state = new InstanceAttachmentsState(null, fetchFormAttachment);

      expect(state.getInitialFileValue(leafWithValue(''))).toBeNull();
      expect(fetchFormAttachment).not.toHaveBeenCalled();
    });

    it('rejects when value is not a jr:// reference and has no source attachment', async () => {
      const fetchFormAttachment = vi.fn<FetchFormAttachment>();
      const state = new InstanceAttachmentsState(null, fetchFormAttachment);

      await expect(state.getInitialFileValue(leafWithValue('plain-value.txt'))).rejects.toThrow(
        AttachmentNotFoundError
      );
      expect(fetchFormAttachment).not.toHaveBeenCalled();
    });

    it('returns null when value is a jr:// reference but no fetchFormAttachment was provided', () => {
      const state = new InstanceAttachmentsState();

      expect(state.getInitialFileValue(leafWithValue('jr://images/default.png'))).toBeNull();
    });
  });
});
