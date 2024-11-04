import type { XFormsSecondaryInstanceMap } from '@getodk/xpath';
import type { EngineXPathNode } from '../../../integration/xpath/adapter/kind.ts';
import { parseStaticDocumentFromDOMSubtree } from '../../shared/parseStaticDocumentFromDOMSubtree.ts';
import type { XFormDOM } from '../../XFormDOM.ts';
import { SecondaryInstanceDefinition } from './SecondaryInstanceDefinition.ts';
import { SecondaryInstanceRootDefinition } from './SecondaryInstanceRootDefinition.ts';

export class SecondaryInstancesDefinition
	extends Map<string, SecondaryInstanceRootDefinition>
	implements XFormsSecondaryInstanceMap<EngineXPathNode>
{
	static from(xformDOM: XFormDOM): SecondaryInstancesDefinition {
		const definitions = xformDOM.secondaryInstanceElements.map((element) => {
			return parseStaticDocumentFromDOMSubtree(
				SecondaryInstanceDefinition,
				SecondaryInstanceRootDefinition,
				element
			);
		});

		return new this(definitions);
	}

	private constructor(translations: readonly SecondaryInstanceDefinition[]) {
		super(
			translations.map(({ root }) => {
				return [root.getAttributeValue('id'), root];
			})
		);
	}
}
