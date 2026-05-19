import type { StaticDocument } from '../../../integration/xpath/static-dom/StaticDocument.ts';
import type { SecondaryInstanceDefinition } from './SecondaryInstancesDefinition.ts';

type AssertSecondaryInstanceDefinition = (
	doc: StaticDocument
) => asserts doc is SecondaryInstanceDefinition;

export const assertSecondaryInstanceDefinition: AssertSecondaryInstanceDefinition = ({ root }) => {
	const id = root.getAttributeValue('id');

	if (id == null) {
		throw new Error();
	}
};
