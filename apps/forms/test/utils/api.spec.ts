import { afterEach, describe, expect, it, vi } from 'vitest';
import { getProject, getFormByFormId, getFormByEnketoId, getFormXml, getSubmissionAttachmentNames } from '../../src/utils/api';

describe('Test api utility', () => {

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getSubmissionAttachmentNames', () => {

    it('responds with an empty array when no attachments', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([]),
      }));
      const actual = await getSubmissionAttachmentNames(5, 'simple', 'abc');
      expect(actual).toEqual([]);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('/v1/projects/5/forms/simple/submissions/abc/attachments');
    });

    it('responds with an array of names when attachments exist', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ name: 'a', exists: true },{ name: 'b', exists: true }]),
      }));
      const actual = await getSubmissionAttachmentNames(5, 'simple', 'abc');
      expect(actual).toEqual(['a','b']);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('/v1/projects/5/forms/simple/submissions/abc/attachments');
    });

    it('filters out attachments that do not exist', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve([{ name: 'a', exists: false },{ name: 'b', exists: true }]),
      }));
      const actual = await getSubmissionAttachmentNames(5, 'simple', 'abc');
      expect(actual).toEqual(['b']);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('/v1/projects/5/forms/simple/submissions/abc/attachments');
    });

    it('handles central errors', async () => {
      const expected = { message: 'Not found', code: '404' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve(expected),
      }));
      await expect(getSubmissionAttachmentNames(5, 'simple', 'abc')).rejects.toThrow('Not found');
    });

  });

  describe('getFormXml', () => {

    const expected = '<x/>';
    const stubXmlFetch = () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(expected),
      }));
    };

    [
      { draft: false, st: undefined, url: '/v1/projects/5/forms/simple.xml' },
      { draft: true,  st: undefined, url: '/v1/projects/5/forms/simple/draft.xml' },
      { draft: false, st: 'xyz',     url: '/v1/projects/5/forms/simple.xml?st=xyz' },
      { draft: true,  st: 'xyz',     url: '/v1/projects/5/forms/simple/draft.xml?st=xyz' },
    ].forEach(({ draft, st, url }) => {
      it(`with draft=${draft}, st=${st}`, async () => {
        stubXmlFetch();
        const actual = await getFormXml(5, 'simple', draft, st);
        expect(actual).toEqual(expected);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(url);
      });
    });

    it('handles central errors', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found', code: '404' }),
      }));
      await expect(getFormXml(5, 'simple', true)).rejects.toThrow('Not found');
    });

  });

  describe('getForm', () => {

    const expectedForm = {
      name: 'Simple',
      xmlFormId: 'simple',
      enketoId: 'abcdef',
      projectId: 5,
      state: 'open',
      draft: false,
      webformsEnabled: false
    };
    
    const stubFormFetch = () => {
      const form = {
        projectId: 5,
        xmlFormId: 'simple',
        name: 'Simple',
        version: '2.1',
        enketoId: 'abcdef',
        hash: '51a93eab3a1974dbffc4c7913fa5a16a',
        keyId: 3,
        state: 'open',
        publishedAt: '2018-01-21T00:04:11.153Z',
        createdAt: '2018-01-19T23:58:03.395Z',
        updatedAt: '2018-03-21T12:45:02.312Z'
      };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(form),
      }));
    };

    describe('by form id', () => {

      [
        { draft: false, st: undefined, url: '/v1/projects/5/forms/simple' },
        { draft: true,  st: undefined, url: '/v1/projects/5/forms/simple/draft' },
        { draft: false, st: 'xyz',     url: '/v1/projects/5/forms/simple?st=xyz' },
        { draft: true,  st: 'xyz',     url: '/v1/projects/5/forms/simple/draft?st=xyz' },
      ].forEach(({ draft, st, url }) => {
        it(`with draft=${draft}, st=${st}`, async () => {
          stubFormFetch();
          const actual = await getFormByFormId(5, 'simple', draft, st);
          expect(actual).toEqual(expectedForm);
          expect(fetch).toHaveBeenCalledTimes(1);
          expect(fetch).toHaveBeenCalledWith(url);
        });
      });

      it('handles central errors', async () => {
        const expected = { message: 'Not found', code: '404' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: () => Promise.resolve(expected),
        }));
        await expect(getFormByFormId(5, 'simple', true)).rejects.toThrow('Not found');
      });
    });

    describe('by enketo id', () => {
      it('no st', async () => {
        stubFormFetch();
        const actual = await getFormByEnketoId('abc');
        expect(actual).toEqual(expectedForm);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/v1/form-links/abc/form');
      });

      it('st', async () => {
        stubFormFetch();
        const actual = await getFormByEnketoId('abc', 'zyx');
        expect(actual).toEqual(expectedForm);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/v1/form-links/abc/form?st=zyx');
      });

      it('handles central errors', async () => {
        const expected = { message: 'Not found', code: '404' };
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: () => Promise.resolve(expected),
        }));
        await expect(getFormByEnketoId('abc')).rejects.toThrow('Not found');
      });
    });
  });

  describe('getProject', () => {
    it('fetches the project', async () => {
      const expected = { verbs: ['run', 'walk'] };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(expected),
      }));
      const actual = await getProject(5);
      expect(actual).toEqual(expected);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith('/v1/projects/5', { headers: new Headers({
        'Content-Type': 'application/json',
        'X-Extended-Metadata': 'true'
      })});
    });

    it('handles central errors', async () => {
      const expected = { message: "I'm a teapot", code: '418' };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve(expected),
      }));
      await expect(getProject(5)).rejects.toThrow("I'm a teapot");
    });
  });
});
