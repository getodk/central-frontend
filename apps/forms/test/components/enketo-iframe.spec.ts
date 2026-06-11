import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOMWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils';
import EnketoIframe from '../../src/components/enketo-iframe.vue';
import Location from '../../src/utils/location';

const enketoId = 'sCTIfjC5LrUto4yVXRYJkNKzP7e53vo';

const postMessageToParent = async (iframe: DOMWrapper<HTMLIFrameElement>, data: string) => {
  const script = document.createElement('script');
  script.textContent = `window.parent.postMessage('${data}', "*");`;
  iframe.element.contentDocument?.body.appendChild(script);
  await flushPromises();
};

const mockUseRoute = vi.fn()
vi.mock('vue-router', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  useRoute: () => mockUseRoute()
}))

const mockAssign = vi.fn();
const mockOrigin = vi.fn();

describe('EnketoIframe', () => {

  enableAutoUnmount(afterEach);

  beforeEach(() => {
    vi.spyOn(Location, 'assign').mockImplementation(mockAssign);
    vi.spyOn(Location, 'origin').mockImplementation(mockOrigin);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const setup = (actionType, query={}, origin?) => {
    mockUseRoute.mockReturnValue({ query });
    mockOrigin.mockReturnValue(origin ?? window.location.origin);
    const component = mount(EnketoIframe, {
      attachTo: document.body,
      props: {
        enketoId,
        form: { name: 'simple', xmlFormId: '', projectId: 1, enketoId, state: 'open', draft: false, webformsEnabled: false },
        actionType
      }
    });
    return component.find('iframe');
  }

  [
    { actionType: 'new', expected: `/enketo-passthrough/${enketoId}` },
    { actionType: 'public-link', expected: `/enketo-passthrough/single/${enketoId}` },
    { actionType: 'preview', expected: `/enketo-passthrough/preview/${enketoId}` },
  ].forEach(({ actionType, expected }) => {
    it(`renders iframe with correct src when actionType is ${actionType}`, () => {
      const iframe = setup(actionType);
      expect(iframe.exists()).to.equal(true);
      expect(iframe.attributes('src')).to.contain(expected);
    });
  });

  it('renders iframe with /single prefix when single=true query parameter for new submission', () => {
    const iframe = setup('new', { single: 'true' });
    expect(iframe.attributes('src')).to.contain('/enketo-passthrough/single/');
  });

  it('renders iframe without /single prefix when single=false for public-link', () => {
    const iframe = setup('new', { single: 'false', st: 'token' });
    expect(iframe.attributes('src')).to.contain(`/enketo-passthrough/${enketoId}`);
    expect(iframe.attributes('src')).to.not.contain('/single/');
  });

  it('redirects on submissionsuccess message with return_url', async () => {
    const iframe = setup('public-link', { return_url: `${window.location.origin}/projects/1` });
    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);
    expect(Location.assign).toHaveBeenCalledTimes(1);
    expect(Location.assign).toHaveBeenCalledWith(new URL(`${window.location.origin}/projects/1`));
  });

  it('redirect on submissionsuccess for new submission when single=true', async () => {
    const iframe = setup('new', { single: 'true', return_url: `${window.location.origin}/projects/1` });
    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);
    expect(Location.assign).toHaveBeenCalledTimes(1);
    expect(Location.assign).toHaveBeenCalledWith(new URL(`${window.location.origin}/projects/1`));
  });

  it('does not redirect on invalid return URL', async () => {
    const iframe = setup('new', { single: 'true', return_url: 'example.com' });
    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);
    expect(Location.assign).toHaveBeenCalledTimes(0);
  });

  it('does not redirect on submissionsuccess for public-link when single=false', async () => {
    const iframe = setup('public-link', { single: 'false', return_url: 'http://example.com/projects/1' });
    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);
    expect(Location.assign).toHaveBeenCalledTimes(0);
  });

  // 'single' query parameter is false implicitly
  it('does not redirects on submissionsuccess for new submission', async () => {
    const iframe = setup('new', { return_url: 'http://example.com/projects/1' });
    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);
    expect(Location.assign).toHaveBeenCalledTimes(0);
  });

  it('bubbles up the message event', async () => {
    const postMessage = vi.fn();
    vi.spyOn(window.parent, 'postMessage').mockImplementation(postMessage);
    const iframe = setup('new', { parentWindowOrigin: window.location.origin });
    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(data, window.location.origin);
  });

  it('should not bubble up the message event if origin is different', async () => {
    const postMessage = vi.fn();
    vi.spyOn(window.parent, 'postMessage').mockImplementation(postMessage);
    const iframe = setup('new', { parentWindowOrigin: window.location.origin }, 'https://example.com');
    const data = JSON.stringify({ enketoEvent: 'submissionsuccess' });
    await postMessageToParent(iframe, data);
    expect(postMessage).toHaveBeenCalledTimes(0);
  });

  it('encodes spaces as %20 instead of + in query parameters', () => {
    const iframe = setup('new', { 'd[/some/path]': 'hello world' });
    expect(iframe.attributes('src')).to.contain('hello%20world');
  });

  it('passes + sign as %20', () => {
    const iframe = setup('new', { 'd[/some/path]': 'hello + world' });
    expect(iframe.attributes('src')).to.contain('hello%20%2B%20world');
  });
});
