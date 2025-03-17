import { QualifiedName, type QualifiedNameSource } from '../../../lib/names/QualifiedName.ts';
import { UnprefixedXFormsName } from '../../../lib/names/UnprefixedXFormsName.ts';

// prettier-ignore
export type StaticNodeNameSource =
	| QualifiedName
	| QualifiedNameSource
	| string;

export const staticNodeName = (source: StaticNodeNameSource): QualifiedName => {
	if (source instanceof QualifiedName) {
		return source;
	}

	if (typeof source === 'string') {
		return new UnprefixedXFormsName(source);
	}

	return new QualifiedName(source);
};
