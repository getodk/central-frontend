const JR_RESOURCE_URL_PROTOCOL = 'jr:';
type JRResourceURLProtocol = typeof JR_RESOURCE_URL_PROTOCOL;

export type JRResourceURLString = `${JRResourceURLProtocol}${string}`;

const All_RESOURCE_TYPES = ['image', 'audio', 'video'] as const;
export type ResourceType = typeof All_RESOURCE_TYPES[number];

export const isResourceType = (string: string): string is ResourceType => {
	return All_RESOURCE_TYPES.includes(string as ResourceType);
};

interface ValidatedJRResourceURL extends URL {
	readonly protocol: JRResourceURLProtocol;
	readonly href: JRResourceURLString;
}

type ValidateJRResourceURL = (url: URL) => asserts url is ValidatedJRResourceURL;

const validateJRResourceURL: ValidateJRResourceURL = (url) => {
	if (import.meta.env.DEV) {
		const { protocol, href } = url;

		if (protocol !== JR_RESOURCE_URL_PROTOCOL || !href.startsWith(JR_RESOURCE_URL_PROTOCOL)) {
			throw new Error(`Invalid JRResoruceURL: ${url}`);
		}
	}
};

export class JRResourceURL extends URL {
	static create(category: string, fileName: string): JRResourceURL {
		return new this(`jr://${category}/${fileName}`);
	}

	static from(url: JRResourceURLString): JRResourceURL {
		return new this(url);
	}

	static isJRResourceReference(reference: string | null): reference is JRResourceURLString {
		return reference?.startsWith(JR_RESOURCE_URL_PROTOCOL) ?? false;
	}

	declare readonly protocol: JRResourceURLProtocol;
	declare readonly href: JRResourceURLString;

	private constructor(url: JRResourceURL);
	private constructor(url: JRResourceURLString);
	private constructor(url: URL | string) {
		super(url);

		validateJRResourceURL(this);
	}
}
