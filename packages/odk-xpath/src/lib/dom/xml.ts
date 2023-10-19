const parser = new DOMParser();

export const parseXMLDocument = (xml: string) => parser.parseFromString(xml, 'text/xml');
