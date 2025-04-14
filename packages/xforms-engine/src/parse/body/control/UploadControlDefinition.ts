import type { UploadMediaOptions, UploadNodeOptions } from '../../../client/UploadNode.ts';
import { ErrorProductionDesignPendingError } from '../../../error/ErrorProductionDesignPendingError.ts';
import type { XFormDefinition } from '../../XFormDefinition.ts';
import {
	unknownAppearanceParser,
	type UnknownAppearanceDefinition,
} from '../appearance/unknownAppearanceParser.ts';
import type { BodyElementParentContext } from '../BodyDefinition.ts';
import { ControlDefinition } from './ControlDefinition.ts';

const MEDIATYPE_PATTERN = /^([^/]+)\/([^/]+)$/;

// prettier-ignore
type MediaTypeMatches =
	| readonly [$0: string, $1: string, $2: string];

const parseUploadMediaOptions = (element: Element): UploadMediaOptions => {
	const mediaType = element.getAttribute('mediatype')?.trim();

	if (mediaType == null || mediaType === '') {
		return {
			accept: '*',
			type: null,
			subtype: null,
		};
	}

	const matches = MEDIATYPE_PATTERN.exec(mediaType) as MediaTypeMatches | null;

	if (matches == null) {
		throw new ErrorProductionDesignPendingError(`Unsupported mediatype: ${mediaType}`);
	}

	const [accept, type, subtype] = matches;

	return {
		accept,
		type,
		subtype,
	};
};

const parseUploadNodeOptions = (element: Element): UploadNodeOptions => {
	const media = parseUploadMediaOptions(element);

	return { media };
};

export class UploadControlDefinition extends ControlDefinition<'upload'> {
	static override isCompatible(localName: string): boolean {
		return localName === 'upload';
	}

	readonly type = 'upload';
	readonly appearances: UnknownAppearanceDefinition;
	readonly options: UploadNodeOptions;

	constructor(form: XFormDefinition, parent: BodyElementParentContext, element: Element) {
		super(form, parent, element);

		this.appearances = unknownAppearanceParser.parseFrom(element, 'appearance');
		this.options = parseUploadNodeOptions(element);
	}

	override toJSON(): object {
		return {};
	}
}
