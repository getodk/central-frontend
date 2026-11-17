import MapPlaceSearch from '@getodk/web-forms/components/common/map/MapPlaceSearch.vue';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { globalMountOptions } from '../../../helpers.ts';

describe('MapPlaceSearch', () => {
  const okResponse = (labels: string[]) => {
    const results = labels.map((label) => ({
      formatted_address: label,
      geometry: {
        viewport: {
          southwest: { lat: 51.38, lng: -0.35 },
          northeast: { lat: 51.67, lng: 0.15 },
        },
      },
    }));
    return new Response(JSON.stringify({ status: 'OK', results }), { status: 200 });
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

  const focusedPlace = (component: ReturnType<typeof mountPlaceSearch>) => {
    return component.get('button:focus');
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

    const onDocumentKeydown = listenForDocumentKeydown();
    input.element.focus();
    await input.trigger('keydown.down');
    expect(focusedPlace(component).text()).toBe('London, UK');
    await focusedPlace(component).trigger('keydown.down');
    expect(focusedPlace(component).text()).toBe('London, CA');
    await focusedPlace(component).trigger('keydown.up');
    expect(focusedPlace(component).text()).toBe('London, UK');

    expect(onDocumentKeydown).not.toHaveBeenCalled();
    document.removeEventListener('keydown', onDocumentKeydown);
  });

  it('picking a place fills the input, closes the list and emits its viewport', async () => {
    const { component, input } = await searchAndOpen(['London, UK']);

    await component.get('button').trigger('click');

    expect(input.element.value).toBe('London, UK');
    expect(component.text()).not.toContain('London, UK');
    expect(component.emitted('selectPlace')).toEqual([[[-0.35, 51.38, 0.15, 51.67]]]);
  });
});
