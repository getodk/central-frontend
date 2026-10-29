import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import * as idbkeyval from 'idb-keyval';
import { clearExpiredAutosave, getAutosave } from '../../src/utils/autosave';
import type { InstanceSnapshot } from '@getodk/xforms-engine';
import type { Form } from '../../src/utils/api';

vi.mock('idb-keyval', { spy: true });

describe('autosave util', () => {

  let form: Form;
  let idbGet: Mock;
  let idbDelete: Mock;
  let idbKeys: Mock;
  let idbSet: Mock;

  beforeEach(() => {
    form = { projectId: 5, xmlFormId: 'myform' } as Form;
    idbGet = vi.spyOn(idbkeyval, 'get');
    idbDelete = vi.spyOn(idbkeyval, 'del');
    idbKeys = vi.spyOn(idbkeyval, 'keys');
    idbSet = vi.spyOn(idbkeyval, 'set');
  });

  afterEach(() => {
    idbGet.mockRestore();
    idbDelete.mockRestore();
    idbKeys.mockRestore();
    idbSet.mockRestore();
  });

  describe('getAutosave', () => {
    it('handles no autosave record', async () => {
      const actual = await getAutosave(form);
      expect(actual).toBeUndefined();
    });

    it('returns found autosave', async () => {
      const expected: InstanceSnapshot = {
        xml: '<form/>',
        attachments: []
      };
      idbGet.mockResolvedValue({
        createdOn: new Date(),
        snapshot: expected
      });
      const actual = await getAutosave(form);
      expect(actual).toEqual(expected);
    });

    it('deletes expired autosave', async () => {
      idbGet.mockResolvedValue({
        createdOn: new Date('2026-09-01'),
        snapshot: {
          xml: '<form/>',
          attachments: []
        }
      });
      const actual = await getAutosave(form);
      expect(actual).toBeUndefined();
      expect(idbDelete).toHaveBeenCalledWith('autosave-entry-5-myform');
    });
  });

  describe('clearExpiredAutosave', () => {
    it('does nothing if the oldest autosave has not expired', async () => {
      idbGet.mockResolvedValue(new Date());
      await clearExpiredAutosave();
      expect(idbKeys).toHaveBeenCalledTimes(0);
      expect(idbDelete).toHaveBeenCalledTimes(0);
    });

    it('does nothing if no autosaves found', async () => {
      idbGet.mockResolvedValue(new Date('2026-09-01'));
      idbKeys.mockResolvedValue(['something', 'notanautosave']);
      await clearExpiredAutosave();
      expect(idbKeys).toHaveBeenCalledTimes(1);
      expect(idbDelete).toHaveBeenCalledTimes(0);
    });

    it('clears the expired autosaves', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      idbGet
        .mockResolvedValueOnce(new Date('2026-09-01'))
        .mockResolvedValueOnce({ createdOn: new Date('2026-09-01') })
        .mockResolvedValueOnce({ createdOn: yesterday }) // not expired
        .mockResolvedValue({ createdOn: new Date('2026-09-02') });
      idbKeys.mockResolvedValue([
        'autosave-entry-5-myform1',
        'autosave-entry-5-myform2',
        'autosave-entry-5-myform3'
      ]);
      await clearExpiredAutosave();
      expect(idbKeys).toHaveBeenCalledTimes(1);
      expect(idbDelete).toHaveBeenCalledTimes(2);
      expect(idbDelete).toHaveBeenNthCalledWith(1, 'autosave-entry-5-myform1');
      expect(idbDelete).toHaveBeenNthCalledWith(2, 'autosave-entry-5-myform3');
      expect(idbSet).toHaveBeenCalledWith('autosave-oldest-entry', yesterday);
    });
  });
});
