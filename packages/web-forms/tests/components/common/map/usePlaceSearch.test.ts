import { usePlaceSearch } from '@getodk/web-forms/components/common/map/usePlaceSearch.ts';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('usePlaceSearch', () => {
  const geocodingResult = (label: string) => ({
    formattedAddress: label,
    viewport: {
      low: { latitude: 51.38, longitude: -0.35 },
      high: { latitude: 51.67, longitude: 0.15 },
    },
  });

  const okResponse = (labels: string[]) => {
    const body = labels.length ? { results: labels.map((label) => geocodingResult(label)) } : {};
    return new Response(JSON.stringify(body), { status: 200 });
  };

  const failedResponse = () => new Response('', { status: 500 });

  const pendingFetch = (_url: RequestInfo | URL, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError')));
    });
  };

  const labelsOf = (placeSearch: ReturnType<typeof usePlaceSearch>) => {
    return placeSearch.places.value.map((place) => place.label);
  };

  const searchFor = (placeSearch: ReturnType<typeof usePlaceSearch>, text: string) => {
    placeSearch.query.value = text;
    placeSearch.searchNow();
  };

  const waitUntilOpen = (placeSearch: ReturnType<typeof usePlaceSearch>) => {
    return vi.waitFor(() => expect(placeSearch.isOpen.value).toBe(true));
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('sends the trimmed text in the path, and the key and field mask as headers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse([]));
    const placeSearch = usePlaceSearch('test key');

    searchFor(placeSearch, '  London, UK/Camden ');
    await waitUntilOpen(placeSearch);

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(url).toBe('https://geocode.googleapis.com/v4/geocode/address/London%2C%20UK%2FCamden');
    expect(init!.headers).toEqual({
      'X-Goog-Api-Key': 'test key',
      'X-Goog-FieldMask': 'results.formattedAddress,results.viewport',
    });
  });

  it('opens with each result as a label and a lon/lat viewport', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(['London, UK']));
    const placeSearch = usePlaceSearch('test-key');

    searchFor(placeSearch, 'London');
    await waitUntilOpen(placeSearch);

    expect(placeSearch.places.value).toEqual([
      { label: 'London, UK', lonLatViewport: [-0.35, 51.38, 0.15, 51.67] },
    ]);
  });

  it('keeps only the first four results', async () => {
    const labels = ['Oxford, UK', 'Cambridge, UK', 'Reading, UK', 'Brighton, UK', 'Bath, UK'];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(labels));
    const placeSearch = usePlaceSearch('test-key');

    searchFor(placeSearch, 'England');
    await waitUntilOpen(placeSearch);

    expect(labelsOf(placeSearch)).toEqual(labels.slice(0, 4));
  });

  it('opens with no places and no error when nothing matched', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    const placeSearch = usePlaceSearch('test-key');

    searchFor(placeSearch, 'Nowhere, UK');
    await waitUntilOpen(placeSearch);

    expect(labelsOf(placeSearch)).toEqual([]);
    expect(placeSearch.hasError.value).toBe(false);
  });

  it('shows an error when Google rejects or the request fails, and retries the same text', async () => {
    const denied = JSON.stringify({ error: { code: 400, status: 'INVALID_ARGUMENT' } });
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response(denied, { status: 400 }))
      .mockResolvedValueOnce(failedResponse())
      .mockResolvedValueOnce(okResponse(['Oxford, UK']));
    const placeSearch = usePlaceSearch('test-key');

    searchFor(placeSearch, 'Oxford');
    await waitUntilOpen(placeSearch);
    expect(placeSearch.hasError.value).toBe(true);

    searchFor(placeSearch, 'Oxford');
    await waitUntilOpen(placeSearch);
    expect(placeSearch.hasError.value).toBe(true);

    searchFor(placeSearch, 'Oxford');
    await vi.waitFor(() => expect(labelsOf(placeSearch)).toEqual(['Oxford, UK']));
    expect(placeSearch.hasError.value).toBe(false);
  });

  it('ignores text shorter than three characters', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const placeSearch = usePlaceSearch('test-key');

    searchFor(placeSearch, '   ');
    searchFor(placeSearch, ' ab ');

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(placeSearch.isOpen.value).toBe(false);
  });

  it('is searching only while a request is pending and the search is active', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockImplementationOnce(pendingFetch)
      .mockResolvedValueOnce(okResponse(['Oxford, UK']));
    const placeSearch = usePlaceSearch('test-key');

    searchFor(placeSearch, 'Oxford');
    expect(placeSearch.isSearching.value).toBe(true);
    placeSearch.dismiss();
    expect(placeSearch.isSearching.value).toBe(false);

    searchFor(placeSearch, 'Cambridge');
    await waitUntilOpen(placeSearch);
    expect(placeSearch.isSearching.value).toBe(false);
  });

  it('searches one second after the last keystroke', () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse([]));
    const placeSearch = usePlaceSearch('test-key');

    placeSearch.query.value = 'Oxf';
    placeSearch.scheduleSearch();
    vi.advanceTimersByTime(999);
    placeSearch.query.value = 'Oxford';
    placeSearch.scheduleSearch();
    vi.advanceTimersByTime(999);
    expect(fetchSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(new URL(fetchSpy.mock.calls[0]![0] as string).pathname).toBe(
      '/v4/geocode/address/Oxford'
    );
  });

  it('closes while typing and reopens on activate when the text still matches', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(['Oxford, UK']));
    const placeSearch = usePlaceSearch('test-key');
    searchFor(placeSearch, 'Oxford');
    await waitUntilOpen(placeSearch);

    placeSearch.scheduleSearch();
    expect(placeSearch.isOpen.value).toBe(false);

    placeSearch.dismiss();
    placeSearch.activate();
    expect(placeSearch.isOpen.value).toBe(true);
  });

  it('does not request the same text again, ignoring case and surrounding spaces', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(['Oxford, UK']));
    const placeSearch = usePlaceSearch('test-key');

    searchFor(placeSearch, 'Oxford');
    searchFor(placeSearch, 'oxford');
    await waitUntilOpen(placeSearch);
    searchFor(placeSearch, ' OXFORD ');

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(placeSearch.isOpen.value).toBe(true);
  });

  it('replaces a running search and shows no places until the new ones arrive', async () => {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(okResponse(['Oxford, UK']))
      .mockImplementationOnce(pendingFetch)
      .mockResolvedValueOnce(okResponse(['Cambridge, UK']));
    const placeSearch = usePlaceSearch('test-key');
    searchFor(placeSearch, 'Oxford');
    await waitUntilOpen(placeSearch);

    searchFor(placeSearch, 'Cambridge');
    expect(labelsOf(placeSearch)).toEqual([]);
    expect(placeSearch.isOpen.value).toBe(false);

    searchFor(placeSearch, 'Cambridge, UK');
    await waitUntilOpen(placeSearch);
    expect(fetchSpy.mock.calls[1]![1]!.signal!.aborted).toBe(true);
    expect(labelsOf(placeSearch)).toEqual(['Cambridge, UK']);
  });

  it('stays closed when a response arrives for older text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(['Oxford, UK']));
    const placeSearch = usePlaceSearch('test-key');

    searchFor(placeSearch, 'Oxf');
    placeSearch.query.value = 'Oxford';
    await vi.waitFor(() => expect(labelsOf(placeSearch)).toEqual(['Oxford, UK']));

    expect(placeSearch.isOpen.value).toBe(false);
  });

  it('picking a place makes its label the text and reopens it without a request', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(['Oxford, UK']));
    const placeSearch = usePlaceSearch('test-key');
    searchFor(placeSearch, 'Oxford');
    await waitUntilOpen(placeSearch);

    placeSearch.select(placeSearch.places.value[0]!);
    expect(placeSearch.query.value).toBe('Oxford, UK');
    expect(placeSearch.isOpen.value).toBe(false);

    placeSearch.activate();
    placeSearch.searchNow();
    expect(placeSearch.isOpen.value).toBe(true);
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(labelsOf(placeSearch)).toEqual(['Oxford, UK']);
  });

  it('cancel drops the scheduled search and the running request', () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(pendingFetch);
    const placeSearch = usePlaceSearch('test-key');

    searchFor(placeSearch, 'Oxford');
    placeSearch.query.value = 'Cambridge';
    placeSearch.scheduleSearch();
    placeSearch.cancel();
    vi.advanceTimersByTime(1000);
    vi.runAllTicks();

    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy.mock.calls[0]![1]!.signal!.aborted).toBe(true);
    expect(placeSearch.hasError.value).toBe(false);
    expect(placeSearch.isOpen.value).toBe(false);
  });
});
