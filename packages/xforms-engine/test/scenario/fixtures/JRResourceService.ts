import { JRResource } from './JRResource.ts';
import type { JRResourceURLString } from '@getodk/common/jr-resources/JRResourceURL';
import { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL';

export interface InlineFixtureMetadata {
  readonly url: JRResourceURLString;
  readonly fileName: string;
  readonly mimeType: string;
}

class JRResourceServiceRegistry extends Map<JRResourceURLString, JRResource> {}

export class JRResourceService {
  readonly resources = new JRResourceServiceRegistry();

  readonly handleRequest = async (url: JRResourceURL | JRResourceURLString): Promise<Response> => {
    let resourceKey: JRResourceURLString;

    if (typeof url === 'string') {
      resourceKey = url;
    } else {
      resourceKey = url.href;
    }

    const resource = this.resources.get(resourceKey);

    if (resource == null) {
      return new Response('Not found', {
        status: 404,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    const { load, mimeType } = resource;
    const body = await load();

    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': mimeType },
    });
  };

  private setRegisteredResourceState(resource: JRResource) {
    const url = resource.url.href;

    if (this.resources.has(url)) {
      throw new Error(`Resource already registered for URL: ${url}`);
    }

    this.resources.set(url, resource);
  }

  // Used to mock fetch in unit tests that work with attachments
  activateResource(metadata: InlineFixtureMetadata, data: string): void {
    const url = JRResourceURL.from(metadata.url);
    const load = () => Promise.resolve(data);
    const resource = new JRResource({
      url,
      fileName: metadata.fileName,
      mimeType: metadata.mimeType,
      load,
    });

    this.setRegisteredResourceState(resource);
  }

  reset(): void {
    this.resources.clear();
  }
}
