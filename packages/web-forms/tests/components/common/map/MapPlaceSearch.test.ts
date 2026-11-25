import MapPlaceSearch from '@getodk/web-forms/components/common/map/MapPlaceSearch.vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { globalMountOptions } from '../../../helpers.ts';

describe('MapPlaceSearch', () => {
  const okResponse = (labels: string[]) => {
    const results = labels.map((label) => ({
      formattedAddress: label,
      location: { latitude: 51.51, longitude: -0.13 },
      viewport: {
        low: { latitude: 51.38, longitude: -0.35 },
        high: { latitude: 51.67, longitude: 0.15 },
      },
      granularity: 'APPROXIMATE',
    }));
    return new Response(JSON.stringify({ results }), { status: 200 });
  };

  const mountPlaceSearch = () => {
    return mount(MapPlaceSearch, {
      props: { apiKey: 'test-key' },
      global: globalMountOptions,
      attachTo: document.body,
    });
  };

  const searchAndOpen = async (labels: string[]) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(labels));
    const component = mountPlaceSearch();
    const input = component.find('input');

    await input.setValue('London');
    await input.trigger('keydown.enter');
    await vi.waitFor(() => expect(component.text()).toContain(labels[0]));

    return { component, input };
  };

  const spyOnFocus = () => vi.spyOn(HTMLElement.prototype, 'focus');

  const focusedTexts = (focusSpy: ReturnType<typeof spyOnFocus>) => {
    const elements = focusSpy.mock.contexts as HTMLElement[];
    return elements.map((element) => element.textContent?.trim());
  };

  const listenForDocumentKeydown = () => {
    const onKeydown = vi.fn();
    document.addEventListener('keydown', onKeydown);
    return onKeydown;
  };

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('escape key closes the open list and does not reach the map', async () => {
    const { component, input } = await searchAndOpen(['London, UK']);

    const onDocumentKeydown = listenForDocumentKeydown();
    await input.trigger('keydown.esc');

    expect(component.text()).not.toContain('London, UK');
    expect(onDocumentKeydown).not.toHaveBeenCalled();
    document.removeEventListener('keydown', onDocumentKeydown);
  });

  it('escape key with no list cancels the pending search and reaches the map', async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(okResponse(['London, UK']));
    const onDocumentKeydown = listenForDocumentKeydown();
    const input = mountPlaceSearch().find('input');

    await input.setValue('London');
    await input.trigger('keydown.esc');
    vi.advanceTimersByTime(1000);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(onDocumentKeydown).toHaveBeenCalledOnce();
    document.removeEventListener('keydown', onDocumentKeydown);
  });

  it('arrow keys move focus through the places and do not reach the map', async () => {
    const { component, input } = await searchAndOpen(['London, UK', 'London, CA']);
    const [firstPlace, secondPlace] = component.findAll('[role="option"]');

    const onDocumentKeydown = listenForDocumentKeydown();
    const focusSpy = spyOnFocus();
    await input.trigger('keydown.down');
    await firstPlace!.trigger('keydown.down');
    await secondPlace!.trigger('keydown.up');

    expect(focusedTexts(focusSpy)).toEqual(['London, UK', 'London, CA', 'London, UK']);
    expect(onDocumentKeydown).not.toHaveBeenCalled();
    document.removeEventListener('keydown', onDocumentKeydown);
  });

  it('shows a spinner only while a search is in progress', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => undefined));
    const component = mountPlaceSearch();
    const input = component.find('input');
    expect(component.find('.search-spinner').exists()).toBe(false);

    await input.setValue('London');
    await input.trigger('keydown.enter');

    expect(component.find('.search-spinner').exists()).toBe(true);
  });

  it('picking a place fills the input, closes the list and emits the place', async () => {
    const { component, input } = await searchAndOpen(['London, UK']);

    await component.get('[role="option"]').trigger('click');

    expect(input.element.value).toBe('London, UK');
    expect(component.text()).not.toContain('London, UK');
    expect(component.emitted('selectPlace')).toEqual([
      [{ label: 'London, UK', lonLatViewport: [-0.35, 51.38, 0.15, 51.67], isArea: true }],
    ]);
  });
});
