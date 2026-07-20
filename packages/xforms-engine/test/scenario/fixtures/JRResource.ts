import { JRResourceURL } from '@getodk/common/jr-resources/JRResourceURL';

type JRResourceLoader = (this: void) => Promise<Blob | string>;

export interface JRResourceSource {
  readonly url: JRResourceURL;
  readonly fileName: string;
  readonly mimeType: string;
  readonly load: JRResourceLoader;
}

export class JRResource {
  readonly url: JRResourceURL;
  readonly fileName: string;
  readonly mimeType: string;
  readonly load: JRResourceLoader;

  constructor(source: JRResourceSource) {
    const { url, fileName, mimeType, load } = source;

    this.url = url;
    this.fileName = fileName;
    this.mimeType = mimeType;
    this.load = load;
  }
}
